import jwt from 'jsonwebtoken'
import md5 from 'md5'
import { v4 as uuid } from 'uuid';
import querystring from "querystring"
import fetch from "node-fetch"

// FIXME: Change this key and pull it from env variable
const key = "Fmg>MN/+0*^-V'8j<mr!GWq1knBXai"

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    //return { statusCode: 405, body: "Method Not Allowed" };
  }

  const params = querystring.parse(event.body)
  const username = params.username || null
  const pass = params.pass ? md5(params.pass) : null
  // NOTE: we could use the IP address to verify that the authorization stays with the IP that authenticated, but that could pose problems with users behind load balances/traveling
  // const fromIP = event.headers?.["x-nf-client-connection-ip"] || "N/A"
  const AUTH_TOKEN = jwt.sign({
    "https://missionbase.com/jwt/claims": {
      "PASSWORD": pass,
      "USERNAME": username,
      "IS_LOGIN_API": true,
    }
  }, key, {
    expiresIn: "10 minutes",
    issuer: "missionbase login",
    jwtid: uuid(),
    subject: "login"
  })

  return {
    statusCode: 200,
    body: AUTH_TOKEN
  }

  return fetch("http://3.231.127.133:8080/graphql", {
    headers: {
      auth: AUTH_TOKEN
    },
    method: "POST",
    body: ``
  }).then(() => ({
    statusCode: 200,
    body: JSON.stringify({
      query: `query ($username: String!){ getUser(username:$username) { username isActive userId hasRole hasPassword { password } hasTypes hasGroupAccess { id hasRights { id name isTrue } forGroup { slug name isContact { id organization } isActive } } isContact { id firstName lastName } } }`,
      variables: { "username": username }
    })
  }))


  // Send greeting to Slack
  return fetch(process.env.SLACK_WEBHOOK_URL, {
    headers: {
      "content-type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({ text: `${name} says hello!` })
  })
    .then(() => ({
      statusCode: 200,
      body: `Hello, ${name}! Your greeting has been sent to Slack 👋`
    }))
    .catch(error => ({
      statusCode: 422,
      body: `Oops! Something went wrong. ${error}`
    }))
}
