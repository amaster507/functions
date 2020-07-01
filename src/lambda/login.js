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
    expiresIn: "1 minute",
    issuer: "missionbase login",
    jwtid: uuid(),
    subject: "login"
  })

  return fetch("http://3.231.127.133:8080/graphql", {
    headers: {
      auth: AUTH_TOKEN,
      'Content-Type': 'application/json'
    },
    method: "POST",
    body: JSON.stringify({
      query: `query ($username: String!){ getUser(username:$username) { username isActive userId hasRole hasPassword { password } hasTypes hasGroupAccess { id hasRights { id name isTrue } forGroup { slug name isContact { id organization } isActive } } isContact { id firstName lastName } } }`,
      variables: { "username": username }
    })
  })
    .then(body => body.json())
    .then(userdata => {
      if (true /** FIXME: put a condition here to check for valid user */) {
        const USER_TOKEN = jwt.sign({
          "https://missionbase.com/jwt/claims": userdata
        }, key, {
          // NOTE: This is the expiration time for users to stay logged in
          // FIXME: We need to implement a refresh token that will update an expiration time based on the users last seen time. That will enable to stay logged in based off their last visit vs. their last login.
          expiresIn: "30 days",
          issuer: "missionbase login",
          jwtid: uuid(),
          subject: "login"
        })
        return {
          statusCode: 200,
          body: JSON.stringify(userdata) // FIXME: change this to the tokenized user data
        }
      }
      return {
        statusCode: 401,
        body: 'The credentials provided did not match any authorized users.'
      }
    })
    .catch(error => ({
      statusCode: 422,
      body: `Oops! Something went wrong. ${error}`
    }))
}
