// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// 環境設定の型定義
export interface Environment {
  production: boolean;
  apiUrl: string;
  cognito?: {
    userPoolId: string;
    userPoolWebClientId: string;
    domain: string;
  };
}

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  // ローカル環境ではCognitoを使用しないが、型定義のために空のオブジェクトを設定
  cognito: {
    userPoolId: '',
    userPoolWebClientId: '',
    domain: ''
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
