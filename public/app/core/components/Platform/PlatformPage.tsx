// Libraries
// import { css } from '@emotion/css';
import React, { FC,useEffect } from 'react';

// Components
// import { HorizontalGroup, LinkButton } from '@grafana/ui';
import { Branding } from 'app/core/components/Branding/Branding';
// import config from 'app/core/config';

// import { ChangePassword } from '../ForgottenPassword/ChangePassword';

// import LoginCtrl from './LoginCtrl';
// import { LoginForm } from './LoginForm';
// import { LoginLayout, 
//   // InnerBox 
// } from './LoginLayout';
// import { LoginServiceButtons } from './LoginServiceButtons';
// import { UserSignup } from './UserSignup';

// import { getBackendSrv } from '@grafana/runtime';

// const forgottenPasswordStyles = css`
//   padding: 0;
//   margin-top: 4px;
// `;

export const PlatformPage: FC = () => {

  // const toGrafana = (result:any) => {
  //   // Use window.location.href to force page reload
  //   if (result.redirectUrl) {
  //     if (config.appSubUrl !== '' && !result.redirectUrl.startsWith(config.appSubUrl)) {
  //       window.location.assign(config.appSubUrl + result.redirectUrl);
  //     } else {
  //       window.location.assign(result.redirectUrl);
  //     }
  //   } else {
  //     window.location.assign(config.appSubUrl + '/');
  //   }
  // };
  useEffect(()=>{
    // const formModel = {
    //   password: "admin",
    //   user: "admin"
    // }
  },[])
  document.title = Branding.AppTitle;
  return (
    <div>PlatPage</div>
  );
};

