import { compareSync, hashSync } from "bcrypt"
import { connectToDatabase } from "../../../lib/mongodb"

/*
REQUEST (POST)

<Body>
username: STRING
password: STRING

RESPONSE

(200)
message: STRING
logged: BOOLEAN
token: STRING || Null
*/

export default async function handler(req, res) {
  const { query, method, body } = req

  let cookies = null

  if (method === "GET") {
    fetch(
      "https://maxconnect.sitel.com/maxconnect/Account/Login?returnurl=%2Fmaxconnect%2F"
    )
      .then((response) => {
        // The API call was successful
        console.log(...response.headers)
        cookies = response.headers.get("set-cookie")
        return response.text()
      })
      .then((html) => {
        console.log(cookies.split(" ")[9])
        //console.log(html)

        var formBody = []

        let details = {
          Username: "lbarr031",
          Password: "Margem Sul Hardcore88",
          __RequestVerificationToken: html.match(
            /(?<=__RequestVerificationToken" type="hidden" value=")(.*)(?=" \/><)/
          )[0],
        }
        for (var property in details) {
          var encodedKey = encodeURIComponent(property)
          var encodedValue = encodeURIComponent(details[property])
          formBody.push(encodedKey + "=" + encodedValue)
        }
        formBody = formBody.join("&")

        let options = {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "Accept-Encoding": "gzip, deflate, br",
            Accept: "/",
            Connection: "keep-alive",
            cookie: cookies.split(" ")[9] + " Path=/maxconnect; HttpOnly;",
          },
          body: formBody,
        }

        console.log(options)

        fetch("https://maxconnect.sitel.com/maxconnect/Account/Login", options)
          .then((response2) => {
            // The API call was successful!
            cookies = response2.headers.get("set-cookie")
            return response2.text()
          })
          .then((html) => res.status(200).send(cookies))
          .catch((err) => {
            console.log(err)
            res.status(500)
          })
      })
      .catch((err) => {
        // There was an error
        console.warn("Something went wrong.", err)
      })
  } else {
    res.status(405).json({ message: "Method not Allowed, use GET only" })
  }
}
