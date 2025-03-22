export const environment = {
  production: true,
  apiUrl: 'https://your-api-endpoint.lambda-url.ap-northeast-1.on.aws/',
  cdnUrl: 'https://your-cloudfront-endpoint.cloudfront.net',
  cognito: {
    userPoolId: 'ap-northeast-1_XXXXXXXXX',
    userPoolWebClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    domain: 'your-app-domain.auth.ap-northeast-1.amazoncognito.com'
  }
};
