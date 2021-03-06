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
        alert(data.message)
        data.user &&
          Cookies.set("user", JSON.stringify(data.user), {
            expires: Math.round(
              data.user.session.expires - new Date().getTime() / 3600000
            ),
          })
        console.log(data.message)
      })
      .catch((err) => console.log("Something went wrong!"))
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

  const resetPassword = (newPassword) => {
    const request = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization(),
      },
      body: JSON.stringify({ password: newPassword }),
    }

    console.log(request)

    fetch("/api/auth/password", request)
      .then((response) => response.json())
      .then((data) => {
        alert(data.message)
      })
      .catch((err) => console.log("Something went wrong!"))
  }

  const upsertUser = ({ username, password, permission }) => {
    const request = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization(),
      },
      body: JSON.stringify({ username, password, permission }),
    }

    console.log(request)

    fetch("/api/auth/user", request)
      .then((response) => response.json())
      .then((data) => {
        alert(data.message)
      })
      .catch((err) => console.log("Something went wrong!"))
  }

  return (
    <AuthContext.Provider
      value={{
        logged,
        user,
        login,
        logout,
        permission,
        authorization,
        resetPassword,
        upsertUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
