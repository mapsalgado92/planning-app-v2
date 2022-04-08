import Head from "next/head"
import { useAuth } from "../contexts/authContext"
import useForm from "../hooks/useForm"

import { FaUser, FaLock, FaIdBadge } from "react-icons/fa"

const formFields = [
  { name: "username", default: "", required: true, type: "text" },
  { name: "password", default: "", required: true, type: "password" },
  { name: "permission", default: "", required: true, type: "number" },
]

export default function Login() {
  const form = useForm({
    fields: formFields,
  })

  const auth = useAuth()

  const handleUpsertUser = () => {
    auth.upsertUser({
      username: form.get("username"),
      password: form.get("password"),
      permission: form.get("permission"),
    })

    form.resetAll()
  }

  return (
    <>
      <Head>
        <title>Planning App | User Admin</title>
      </Head>
      <div className="mt-auto mb-auto">
        <div className="columns">
          <div className="column is-two-fifths has-text-centered mx-auto px-6 pb-5 pt-4 card">
            <h1 className="is-size-5">USER ADMIN</h1>
            <br />
            <>
              <div className="field">
                <label className="label">
                  <FaUser /> Username
                </label>
                <div className="control">
                  <input
                    className="input"
                    onChange={(e) => form.set("username", e.target.value)}
                    value={form.get("username") || ""}
                    type="text"
                    placeholder="Username"
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">
                  <FaLock /> Password
                </label>
                <div className="control">
                  <input
                    className="input"
                    onChange={(e) => form.set("password", e.target.value)}
                    value={form.get("password") || ""}
                    type="password"
                    placeholder="Password"
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">
                  <FaIdBadge /> Permission
                </label>
                <div className="control">
                  <input
                    className="input"
                    onChange={(e) =>
                      form.set("permission", parseInt(e.target.value))
                    }
                    value={form.get("permission") || ""}
                    type="number"
                    placeholder="[1-3]"
                  />
                </div>
              </div>
              <br />
              <button
                className={
                  auth.permission(1) ? "button is-primary" : "button is-danger"
                }
                onClick={handleUpsertUser}
                type="button"
                disabled={!auth.permission(1) || !form.checkRequired()}
              >
                {auth.permission(1) ? (
                  <>Update User </>
                ) : (
                  <>
                    Unauthorized <FaLock />
                  </>
                )}
              </button>
            </>
          </div>
        </div>
      </div>
    </>
  )
}
