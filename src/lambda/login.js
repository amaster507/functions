import jwt from 'jsonwebtoken'
import md5 from 'md5'
import { v4 as uuid } from 'uuid';
import querystring from "querystring"
import fetch from "node-fetch"

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
      "USERNAME": username,
      "PASS": pass
    }
  }, "secretkey", {
    expiresIn: "10 seconds",
    issuer: "missionbase login",
    jwtid: uuid(),
    subject: "login"
  })
  return {
    statusCode: 200,
    body: AUTH_TOKEN
  }


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
