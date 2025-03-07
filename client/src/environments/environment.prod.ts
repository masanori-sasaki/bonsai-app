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
  production: true,
  apiUrl: 'https://amat42gzk53gc6komqnqobuafq0lxfdy.lambda-url.ap-northeast-1.on.aws/',
  cognito: {
    userPoolId: 'ap-northeast-1_Uey2a88nX',
    userPoolWebClientId: '3l2ktjm1b1o9ecm1j8vgpdjbqh',
    domain: 'bonsai-dev-171278323216.auth.ap-northeast-1.amazoncognito.com'
  }
};
