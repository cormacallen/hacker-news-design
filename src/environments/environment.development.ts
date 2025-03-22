export const environment = {
  production: true,
  hackerNewsApi: {
    baseUrl: 'https://hacker-news.firebaseio.com/v0',
    cacheDuration: 5 * 60 * 1000, // 5 minutes in milliseconds
    storiesPerPage: 30,
  },
};
