const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const app = express();

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  const allowedOrigin = 'https://ballscore.vercel.app';
  console.log(req.headers.origin, req.headers.host);
  // Check if the request origin matches the allowed origin
  if (req.headers.origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    next();
  } else {
    return res.status(403).send('FORBIDDEN REQUEST BRO');
  }
});

app.use(
  '/graphql',
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn: (err) => {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || ' An Error occured';
      const code = err.originalError.code || 500;
      // WE can name these field in the way we want
      console.log({ message, code, data });
      return { message, status: code, data };
    },
  })
);
app.use((error, req, res, next) => {
  console.log(error, 'yo ho ra?');
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message, data });
});

app.listen(8080);
