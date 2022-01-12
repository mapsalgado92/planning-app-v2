import Head from "next/head"
import { useState } from "react/cjs/react.development"
import useData from "../hooks/useData"
import useForm from "../hooks/useForm"
import StructureDropdown from "../components/selection/StructureDropdown"
import useWeeks from "../hooks/useWeeks"
import useCapacity from "../hooks/useCapacity"

import WeekDropdown from "../components/selection/WeekDropdown"

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

  const data = useData(["projects", "lobs", "capPlans"])

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

  return (
    <>
      <Head>
        <title>Planning App | Staffing</title>
      </Head>

      <div>
        <h1 className="has-text-centered mb-2 is-size-5">STAFFING</h1>

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
