import { useState } from "react"
import { useAuth } from "../../contexts/authContext"

import { FaLock } from "react-icons/fa"
import CSVUploader from "../files/CSVUploader"

const StaffingManagement = ({ data }) => {
  const [upload, setUpload] = useState([])

  const auth = useAuth()

  //HANDLERS
  const handleSubmit = async (type) => {
    if(type === "standard"){
      await fetch(
        `/api/data/entries/bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: auth.authorization(),
          },
          body: JSON.stringify({ payloads: upload }),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          console.log(data.message)
        })
        .catch((err) => console.log(err))

    }
    
    }

  return (
    <>
      {auth.permission(1) ? (
        <div>
          <div className="columns is-multiline">
            <div className="column is-half">
              <label className="label">Bulk Upload</label>
              <CSVUploader
                removeHandler={() => setUpload([])}
                loadedHandler={(csv) => setUpload(csv)}
                label={
                  "capPlan (ObjId) / lob(ObjId) / project (ObjId) - week (####w#) - [fields...]"
                }
              ></CSVUploader>
              <button
                className="button is-small m-1 is-primary is-rounded"
                onClick={() => {
                  handleSubmit("standard")
                }}
              >
                Upload Standard
              </button>
              <button
                className="button is-small  m-1 is-info is-rounded"
                onClick={() => {
                  handleSubmit("lob")
                }}
              >
                Upload by Lob
              </button>
              <button
                className="button is-small m-1 is-link is-rounded"
                onClick={() => {
                  handleSubmit("project")
                }}
              >
                Upload by Project
              </button>

              <br></br>
              <br></br>

              
              {}
            </div>
            <div className="column is-half">
            <table>
            </table> 
            </div>
          </div>
        </div>
      ) : (
        <div className="message is-danger is-size-5 px-5 py-5">
          <span className="">
            <FaLock />
          </span>{" "}
          UNAUTHORIZED ACCESS
        </div>
      )}
    </>
  )
}

export default StaffingManagement
