// Libraries
// import { css } from '@emotion/css';
import React, { FC,useEffect } from 'react';

// Components
// import { HorizontalGroup, LinkButton } from '@grafana/ui';
import { Branding } from 'app/core/components/Branding/Branding';
import config from 'app/core/config';

// import { ChangePassword } from '../ForgottenPassword/ChangePassword';

// import LoginCtrl from './LoginCtrl';
// import { LoginForm } from './LoginForm';
import { LoginLayout, 
  // InnerBox 
} from './LoginLayout';
// import { LoginServiceButtons } from './LoginServiceButtons';
// import { UserSignup } from './UserSignup';

import { getBackendSrv } from '@grafana/runtime';

// const forgottenPasswordStyles = css`
//   padding: 0;
//   margin-top: 4px;
// `;

export const LoginPage: FC = () => {

  const toGrafana = (result:any) => {
    // Use window.location.href to force page reload
    if (result.redirectUrl) {
      if (config.appSubUrl !== '' && !result.redirectUrl.startsWith(config.appSubUrl)) {
        window.location.assign(config.appSubUrl + result.redirectUrl);
      } else {
        window.location.assign(result.redirectUrl);
      }
    } else {
      window.location.assign(config.appSubUrl + '/');
    }
  };
  useEffect(()=>{
    const formModel = {
      password: "admin",
      user: "admin"
    }
    getBackendSrv()
      .post('/login', formModel)
      .then((result: any) => {
        console.log('登录成功')
        toGrafana(result)
        // this.result = result;
        // if (formModel.password !== 'admin' || config.ldapEnabled || config.authProxyEnabled) {
        //   this.toGrafana();
        //   return;
        // } else {
        //   this.changeView();
        // }
      })
      .catch(() => {
        console.log('登录出错')
        // this.setState({
        //   isLoggingIn: false,
        // });
      });
  },[])
  document.title = Branding.AppTitle;
  return (
    <LoginLayout>
      {/* <LoginCtrl>
        {({
          loginHint,
          passwordHint,
          ldapEnabled,
          authProxyEnabled,
          disableLoginForm,
          disableUserSignUp,
          login,
          isLoggingIn,
          changePassword,
          skipPasswordChange,
          isChangingPassword,
        }) => (
          <>
            {!isChangingPassword && (
              <InnerBox>
                {!disableLoginForm && (
                  <LoginForm
                    onSubmit={login}
                    loginHint={loginHint}
                    passwordHint={passwordHint}
                    isLoggingIn={isLoggingIn}
                  >
                    {!(ldapEnabled || authProxyEnabled) ? (
                      <HorizontalGroup justify="flex-end">
                        <LinkButton
                          className={forgottenPasswordStyles}
                          fill="text"
                          href={`${config.appSubUrl}/user/password/send-reset-email`}
                        >
                          Forgot your password?
                        </LinkButton>
                      </HorizontalGroup>
                    ) : (
                      <></>
                    )}
                  </LoginForm>
                )}
                <LoginServiceButtons />
                {!disableUserSignUp && <UserSignup />}
              </InnerBox>
            )}
            {isChangingPassword && (
              <InnerBox>
                <ChangePassword onSubmit={changePassword} onSkip={() => skipPasswordChange()} />
              </InnerBox>
            )}
          </>
        )}
      </LoginCtrl> */}
    </LoginLayout>
  );
};
