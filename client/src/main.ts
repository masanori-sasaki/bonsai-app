import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Amplify } from 'aws-amplify';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// AWS Amplifyの設定
if (environment.production && environment.cognito) {
  // Amplifyの型定義の問題を回避
  // @ts-ignore
  const amplifyConfig = {
    Auth: {
      region: 'ap-northeast-1',
      userPoolId: environment.cognito.userPoolId,
      userPoolWebClientId: environment.cognito.userPoolWebClientId,
      authenticationFlowType: 'USER_PASSWORD_AUTH'
    }
  };
  
  // @ts-ignore
  Amplify.configure(amplifyConfig);
  console.log('AWS Amplify initialized with Cognito configuration');
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
