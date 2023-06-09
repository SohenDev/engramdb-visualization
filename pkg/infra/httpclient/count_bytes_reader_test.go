package httpclient

import (
	"fmt"
	"io/ioutil"  //nolint:staticcheck // No need to change in v8.
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestCountBytesReader(t *testing.T) {
	tcs := []struct {
		body               string
		expectedBytesCount int64
	}{
		{body: "d", expectedBytesCount: 1},
		{body: "dummy", expectedBytesCount: 5},
	}

	for index, tc := range tcs {
		t.Run(fmt.Sprintf("Test CountBytesReader %d", index), func(t *testing.T) {
			body := ioutil.NopCloser(strings.NewReader(tc.body))
			var actualBytesRead int64

			readCloser := CountBytesReader(body, func(bytesRead int64) {
				actualBytesRead = bytesRead
			})

			bodyBytes, err := ioutil.ReadAll(readCloser)
			require.NoError(t, err)
			err = readCloser.Close()
			require.NoError(t, err)
			require.Equal(t, tc.expectedBytesCount, actualBytesRead)
			require.Equal(t, string(bodyBytes), tc.body)
		})
	}
}
