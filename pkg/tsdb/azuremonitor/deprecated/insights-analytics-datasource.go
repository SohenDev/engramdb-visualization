package deprecated

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"  //nolint:staticcheck // No need to change in v8.
	"net/http"
	"net/url"
	"path"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"go.opentelemetry.io/otel/attribute"

	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/tsdb/azuremonitor/azlog"
	"github.com/grafana/grafana/pkg/tsdb/azuremonitor/loganalytics"
	"github.com/grafana/grafana/pkg/tsdb/azuremonitor/macros"
	"github.com/grafana/grafana/pkg/tsdb/azuremonitor/types"
	"github.com/grafana/grafana/pkg/util/errutil"
)

type InsightsAnalyticsDatasource struct {
	Proxy types.ServiceProxy
}

type InsightsAnalyticsQuery struct {
	RefID string

	RawQuery          string
	InterpolatedQuery string

	ResultFormat string

	Params url.Values
	Target string
}

func (e *InsightsAnalyticsDatasource) ResourceRequest(rw http.ResponseWriter, req *http.Request, cli *http.Client) {
	e.Proxy.Do(rw, req, cli)
}

func (e *InsightsAnalyticsDatasource) ExecuteTimeSeriesQuery(ctx context.Context,
	originalQueries []backend.DataQuery, dsInfo types.DatasourceInfo, client *http.Client,
	url string, tracer tracing.Tracer) (*backend.QueryDataResponse, error) {
	result := backend.NewQueryDataResponse()

	queries, err := e.buildQueries(originalQueries, dsInfo)
	if err != nil {
		return nil, err
	}

	for _, query := range queries {
		result.Responses[query.RefID] = e.executeQuery(ctx, query, dsInfo, client, url, tracer)
	}

	return result, nil
}

func (e *InsightsAnalyticsDatasource) buildQueries(queries []backend.DataQuery, dsInfo types.DatasourceInfo) ([]*InsightsAnalyticsQuery, error) {
	iaQueries := []*InsightsAnalyticsQuery{}

	for _, query := range queries {
		qm := InsightsAnalyticsQuery{}
		queryJSONModel := insightsAnalyticsJSONQuery{}
		err := json.Unmarshal(query.JSON, &queryJSONModel)
		if err != nil {
			return nil, fmt.Errorf("failed to decode the Azure Application Insights Analytics query object from JSON: %w", err)
		}

		qm.RawQuery = queryJSONModel.InsightsAnalytics.Query
		qm.ResultFormat = queryJSONModel.InsightsAnalytics.ResultFormat
		qm.RefID = query.RefID

		if qm.RawQuery == "" {
			return nil, fmt.Errorf("query is missing query string property")
		}

		qm.InterpolatedQuery, err = macros.KqlInterpolate(query, dsInfo, qm.RawQuery)
		if err != nil {
			return nil, err
		}
		qm.Params = url.Values{}
		qm.Params.Add("query", qm.InterpolatedQuery)

		qm.Target = qm.Params.Encode()
		iaQueries = append(iaQueries, &qm)
	}

	return iaQueries, nil
}

func (e *InsightsAnalyticsDatasource) executeQuery(ctx context.Context, query *InsightsAnalyticsQuery, dsInfo types.DatasourceInfo, client *http.Client,
	url string, tracer tracing.Tracer) backend.DataResponse {
	dataResponse := backend.DataResponse{}

	dataResponseError := func(err error) backend.DataResponse {
		dataResponse.Error = err
		return dataResponse
	}

	req, err := e.createRequest(ctx, dsInfo, url)
	if err != nil {
		return dataResponseError(err)
	}
	req.URL.Path = path.Join(req.URL.Path, "query")
	req.URL.RawQuery = query.Params.Encode()

	ctx, span := tracer.Start(ctx, "application insights analytics query")
	span.SetAttributes("target", query.Target, attribute.Key("target").String(query.Target))
	span.SetAttributes("datasource_id", dsInfo.DatasourceID, attribute.Key("datasource_id").Int64(dsInfo.DatasourceID))
	span.SetAttributes("org_id", dsInfo.OrgID, attribute.Key("org_id").Int64(dsInfo.OrgID))

	defer span.End()
	tracer.Inject(ctx, req.Header, span)

	if err != nil {
		azlog.Warn("failed to inject global tracer")
	}

	azlog.Debug("ApplicationInsights", "Request URL", req.URL.String())
	res, err := client.Do(req)
	if err != nil {
		return dataResponseError(err)
	}

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return dataResponseError(err)
	}
	defer func() {
		if err := res.Body.Close(); err != nil {
			azlog.Warn("Failed to close response body", "err", err)
		}
	}()

	if res.StatusCode/100 != 2 {
		azlog.Debug("Request failed", "status", res.Status, "body", string(body))
		return dataResponseError(fmt.Errorf("request failed, status: %s, body: %s", res.Status, body))
	}
	var logResponse loganalytics.AzureLogAnalyticsResponse
	d := json.NewDecoder(bytes.NewReader(body))
	d.UseNumber()
	err = d.Decode(&logResponse)
	if err != nil {
		return dataResponseError(err)
	}

	t, err := logResponse.GetPrimaryResultTable()
	if err != nil {
		return dataResponseError(err)
	}

	frame, err := loganalytics.ResponseTableToFrame(t)
	if err != nil {
		return dataResponseError(err)
	}

	if query.ResultFormat == types.TimeSeries {
		tsSchema := frame.TimeSeriesSchema()
		if tsSchema.Type == data.TimeSeriesTypeLong {
			wideFrame, err := data.LongToWide(frame, nil)
			if err == nil {
				frame = wideFrame
			} else {
				frame.AppendNotices(data.Notice{
					Severity: data.NoticeSeverityWarning,
					Text:     "could not convert frame to time series, returning raw table: " + err.Error(),
				})
			}
		}
	}
	dataResponse.Frames = data.Frames{frame}

	return dataResponse
}

func (e *InsightsAnalyticsDatasource) createRequest(ctx context.Context, dsInfo types.DatasourceInfo, url string) (*http.Request, error) {
	appInsightsAppID := dsInfo.Settings.AppInsightsAppId

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		azlog.Debug("Failed to create request", "error", err)
		return nil, errutil.Wrap("Failed to create request", err)
	}
	req.URL.Path = fmt.Sprintf("/v1/apps/%s", appInsightsAppID)
	return req, nil
}
