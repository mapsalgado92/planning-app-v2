import Head from "next/head"
import { useState } from "react"
import useData from "../hooks/useData"
import useForm from "../hooks/useForm"
import StructureDropdown from "../components/selection/StructureDropdown"
import useWeeks from "../hooks/useWeeks"
import useCapacity from "../hooks/useCapacity"

import WeekDropdown from "../components/selection/WeekDropdown"
import useErlang from "../hooks/useErlang"

import CSVUploader from "../components/files/CSVUploader"
import { useAuth } from "../contexts/authContext"

const selectionFields = [
  { name: "project", default: null, required: true, type: "object", level: 1 },
  { name: "lob", default: null, required: true, type: "object", level: 2 },
  { name: "capPlan", default: null, required: true, type: "object", level: 3 },
  {
    name: "week",
    default: null,
    required: true,
    type: "object",
    level: 1,
  },
]

export default function Staffing() {
  const [locked, setLocked] = useState(false)

  const [shrinkage, setShrinkage] = useState([])

  const data = useData(["projects", "lobs", "capPlans"])

  const auth = useAuth()

  const erlang = useErlang({ interval: 900 })

  const capacity = useCapacity()

  const weeks = useWeeks()

  const selection = useForm({
    fields: selectionFields,
  })

  const handleToggleLock = () => {
    if (locked) {
      capacity.reset()
      setLocked(false)
    } else {
      capacity.generate(selection.get("capPlan"))
      setLocked(true)
    }
  }

  //HANDLERS
  const handleSubmit = async (payload) => {
    await fetch(`/api/data/entries/single`, {
      method: "POST",
      headers: {
        Authorization: auth.authorization(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message)
        alert(data.message)
      })
      .catch((err) => console.log(err))

    data.refresh()
  }

  return (
    <>
      <Head>
        <title>Planning App | Staffing</title>
      </Head>

      <div>
        <h1 className="has-text-centered mb-2 is-size-5">STAFFING</h1>
        <div className="columns">
          <div className="column is-half">
            <div className="columns">
              <div className="column field">
                <label className="label">Selection</label>
                <StructureDropdown
                  structureName="project"
                  selection={selection}
                  data={data && data.projects}
                  disabled={locked}
                  reset={["lob", "capPlan"]}
                  callback={(f) => {
                    f.resetAll()
                  }}
                />
                <StructureDropdown
                  structureName="lob"
                  selection={selection}
                  reset={["capPlan"]}
                  data={
                    data &&
                    selection.get("project") &&
                    data.lobs.filter(
                      (lob) => lob.project === selection.get("project")._id
                    )
                  }
                  disabled={!selection.get("project") || locked}
                />
                <StructureDropdown
                  structureName="capPlan"
                  selection={selection}
                  data={
                    data &&
                    selection.get("lob") &&
                    data.capPlans.filter(
                      (capPlan) => capPlan.lob === selection.get("lob")._id
                    )
                  }
                  disabled={!selection.get("lob") || locked}
                />
              </div>
            </div>
            <div className="columns">
              <div className="column field">
                <label className="label">Weeks</label>
                <WeekDropdown
                  fieldName="week"
                  label="Week"
                  form={selection}
                  weekRange={
                    weeks &&
                    weeks.getWeekRange(
                      selection.get("capPlan")
                        ? selection.get("capPlan").firstWeek
                        : "2021w1",
                      null
                    )
                  }
                />
                <button
                  className="button is-small is-rounded is-info"
                  onClick={() => selection.set("week", weeks.getCurrentWeek())}
                >
                  Next Week
                </button>
              </div>
            </div>
            <div className="columns">
              <div className="column field">
                <button
                  className={`button ${
                    locked ? "is-danger" : "is-primary"
                  } is-small is-rounded`}
                  onClick={handleToggleLock}
                  disabled={!selection.checkRequired && !locked}
                >
                  {locked ? "UNLOCK" : "LOCK"}
                </button>

                <button
                  className={`button is-light is-small is-rounded`}
                  onClick={() => {
                    let extracted = capacity.get([selection.get("week")])[0]
                    let requirements = erlang.generateRequirements({
                      distros: selection.get("capPlan").staffing.distros,
                      vol: parseFloat(extracted.pVolumes),
                      aht: parseFloat(extracted.pAHT),
                      targets: {
                        sl: parseFloat(extracted.pSL),
                        occ: parseFloat(extracted.pOccupancy),
                        tt: parseFloat(extracted.pTT),
                        asa: 0,
                      },
                      abs: parseFloat(extracted.pAbs) / 100,
                      aux: parseFloat(extracted.pAux) / 100,
                      off: parseFloat(extracted.pOff) / 100,
                      absFromTotal:
                        selection.get("capPlan").staffing.absFromTotal,
                    })
                    console.log("Requirements", requirements)
                  }}
                  disabled={
                    !selection.checkRequired ||
                    !locked ||
                    !selection.get("capPlan") ||
                    !selection.get("capPlan").staffing
                  }
                >
                  Generate Requirements
                </button>
              </div>
            </div>
          </div>
          <div className="column is-half">
            <div className="has-text-right">
              <label className="label">Shrinkage</label>
              <CSVUploader
                removeHandler={() => setShrinkage([])}
                loadedHandler={(csv) => setShrinkage(csv)}
                label={"code - mapping - percent"}
              ></CSVUploader>
              <button
                className="button is-small is-link is-rounded"
                onClick={() => {
                  handleSubmit({
                    capPlan: selection.get("capPlan")._id,
                    week: selection.get("week").code,
                    pShrinkage: shrinkage,
                  })
                }}
                disabled={!selection.get("capPlan") || !locked}
              >
                Update Shrinkage
              </button>
            </div>
          </div>
        </div>
        {capacity.isGenerated() && selection.get("week") && (
          <div>
            {JSON.stringify(
              capacity.get([selection.get("week")], ["totalFTE", "billableFTE"])
            )}
          </div>
        )}
      </div>
    </>
  )
}
