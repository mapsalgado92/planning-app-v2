
import { useEffect, useState } from "react"
import { useAuth } from "../../contexts/authContext"

import { FaLock } from "react-icons/fa"
import CSVUploader from "../files/CSVUploader"

const StaffingManagement = ({ data }) => {
  const [upload, setUpload] = useState([])
  const [valid, setValid] = useState(false)

  const auth = useAuth()

  useEffect(()=>{
    const isValid = (upload) => {
      let hasInvalidField = false
      let hasWeek = 0
      let hasTarget = 0
      Object.keys(upload[0]).forEach((key)=>{
        if(["capPlan", "lob", "project"].includes(key)){
          hasTarget++
        } else if(key === "week"){
          hasWeek++ 
        } else{
          let found = data.fields.find(field => (field.internal === key))
          if(!found){
            hasInvalidField = true
          }
        }
      })
      
      let valid = (hasTarget === 1 && hasWeek === 1 && !hasInvalidField)

      if(!valid){
        alert("Invalid Upload File")
      }

      return valid
    }

    upload[0] ? setValid(isValid(upload)) : setValid(false)
    

  }, [upload])

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
            <div className="column">
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
                disabled={
                  !(valid && upload[0] && Object.keys(upload[0]).includes("capPlan"))
                }
              >
                Upload Standard
              </button>
              
          
              <br></br>
              <br></br>

              
              
            </div>
            <div className="column is-narrow has-text-right">
            <label className="label">Field Check</label>



            {upload.length ? <div >
                             
                {Object.keys(upload[0]).map(header => <div key={"uploadField-" + header}>
                  {header}
                  {data.fields.find(field => (field.internal === header)) ? <span className="tag is-success ml-2">Valid</span> : ["capPlan", "lob", "project", "week"].includes(header) ? <span className="tag is-success ml-2">Valid</span>  : <span className="tag is-danger ml-2">Invalid</span>}</div>
                )}
        
            </div>
            :<p className="tag m-auto has-text-right">No upload</p> } 
          
            </div>
            <div className="column is-narrow has-text-right">
            <label className="label">Upload Stats</label>



            {upload.length ? <div>
            <div>Entries <span className="tag is-info ml-2">{upload.length || 0}</span></div> 
            <div>Fields <span className="tag is-info ml-2">{Object.keys(upload[0]).length || 0}</span></div> 
        
            </div>
            :<p className="tag m-auto has-text-right">No upload</p> } 
          
            </div>
          </div>
          <div className="columns is-multiline">

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
