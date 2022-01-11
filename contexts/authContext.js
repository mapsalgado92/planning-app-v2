import { createContext, useContext, useState, useEffect } from "react"
import Cookies from "js-cookie"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [logged, setLogged] = useState(false)
  const [user, setUser] = useState({})

  useEffect(() => {
    let cookie = Cookies.get("user")
    if (cookie) {
      setUser(JSON.parse(cookie))
      setLogged(true)
      console.log("LOGGED IN FROM COOKIE")
    } else {
      console.log("NO COOKIE")
    }
  }, [])

  const login = async ({ username, password }) => {
    const request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: password, username: username }),
    }

    console.log(request)

    fetch("/api/auth/login", request)
      .then((response) => response.json())
      .then((data) => {
        setLogged(data.logged)
        console.log("DATA USER", data.user)
        setUser(data.user)

        data.user &&
          Cookies.set("user", JSON.stringify(data.user), {
            expires: Math.round(
              data.user.session.expires - new Date().getTime() / 3600000
            ),
          })
        alert(data.message)
      })
      .catch((err) => alert("Something went wrong!"))
  }

  const logout = () => {
    setUser(null)
    setLogged(false)
    Cookies.remove("user")
  }

  const permission = (p) => {
    return user ? user.permission <= p : false
  }

  const authorization = () => {
    return user && user.session
      ? Buffer.from(user.username + ":" + user.session.token).toString("base64")
      : null
  }

  return (
    <AuthContext.Provider
      value={{ logged, user, login, logout, permission, authorization }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
