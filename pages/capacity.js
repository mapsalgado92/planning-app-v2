import Head from "next/head"
import { useState } from "react/cjs/react.development"
import useData from "../hooks/useData"
import useForm from "../hooks/useForm"
import StructureDropdown from "../components/selection/StructureDropdown"

import { FaExternalLinkAlt } from "react-icons/fa"
import useWeeks from "../hooks/useWeeks"
import useCapacity from "../hooks/useCapacity"
import WeekDropdown from "../components/selection/WeekDropdown"

import CapacityViewer from "../components/capacity/CapacityViewer"
import TotalPercentageChart from "../components/capacity/TotalPercentageChart"
import CapacityDataGrid from "../components/capacity/CapacityDataGrid"
import EntriesModal from "../components/entries/EntriesModal"

const selectionFields = [
  { name: "project", default: null, required: true, type: "object", level: 1 },
  { name: "lob", default: null, required: true, type: "object", level: 2 },
  { name: "capPlan", default: null, required: true, type: "object", level: 3 },
  {
    name: "fromWeek",
    default: null,
    required: true,
    type: "object",
    level: 1,
  },
  { name: "toWeek", default: null, required: true, type: "object", level: 1 },
]

const entrySelectionFields = [
  {
    name: "entryWeek",
    default: null,
    required: true,
    type: "object",
    level: 1,
  },
]

export default function Capacity() {
  const [weekRange, setWeekRange] = useState([])
  const [active, setActive] = useState(false)

  const data = useData(["projects", "lobs", "capPlans", "languages", "fields"])

  const weeks = useWeeks()

  const capacity = useCapacity()

  const selection = useForm({
    fields: selectionFields,
  })

  const entrySelection = useForm({
    fields: entrySelectionFields,
  })

  const handleGenerate = () => {
    capacity.generate(selection.get("capPlan"))
    let from = selection.get("fromWeek")
    let to = selection.get("toWeek")
    setWeekRange(weeks.getWeekRange(from.code, to.code))
  }

  const handleToggle = () => {
    setActive(!active)
  }

  return (
    <>
      <Head>
        <title>Planning App | Capacity</title>
      </Head>
      <EntriesModal
        selection={selection}
        week={entrySelection.get("entryWeek")}
        toggle={handleToggle}
        active={active}
      />
      <div>
        <h1 className="has-text-centered mb-2 is-size-5">CAPACITY</h1>
        <div className="columns">
          <div className="column is-two-thirds">
            <div className="columns">
              <div className="column field">
                <label className="label">Selection</label>
                <StructureDropdown
                  structureName="project"
                  selection={selection}
                  data={data && data.projects}
                  disabled={false}
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
                  disabled={!selection.get("project")}
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
                  disabled={!selection.get("lob")}
                />
              </div>
            </div>
            <div className="columns">
              <div className="column field">
                <label className="label">Weeks</label>
                <WeekDropdown
                  fieldName="fromWeek"
                  label="From-Week"
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
                  disabled={!selection.get("capPlan")}
                  callback={(f, s) => {
                    if (
                      f.get("toWeek") &&
                      s.firstDate > f.get("toWeek").firstDate
                    ) {
                      f.setMany({ ...f.getForm(), toWeek: s, fromWeek: s })
                    }
                  }}
                />
                <WeekDropdown
                  fieldName="toWeek"
                  label="To-Week"
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
                  disabled={!selection.get("capPlan")}
                  callback={(f, s) => {
                    if (
                      f.get("fromWeek") &&
                      s.firstDate < f.get("fromWeek").firstDate
                    ) {
                      f.setMany({ ...f.getForm(), toWeek: s, fromWeek: s })
                    }
                  }}
                />
                <button
                  className="button is-small is-rounded is-info"
                  onClick={() =>
                    selection.setMany({
                      ...selection.getForm(),
                      fromWeek: weeks.getWeekRelative(parseFloat("-12")),
                      toWeek: weeks.getWeekRelative(parseFloat("12")),
                    })
                  }
                >
                  Auto Weeks
                </button>
              </div>
            </div>
            <div className="columns">
              <div className="column field">
                <button
                  className="button is-primary is-small is-rounded"
                  onClick={handleGenerate}
                  disabled={!selection.checkRequired()}
                >
                  Generate Capacity
                </button>
              </div>
            </div>
          </div>
          <div className="column has-text-right-tablet is-one-third">
            <div className="columns ">
              <div className="column field ">
                <label className="label">Edit Entries</label>
                <WeekDropdown
                  fieldName="entryWeek"
                  label="Entry-Week"
                  form={entrySelection}
                  weekRange={
                    weeks &&
                    weeks.getWeekRange(
                      selection.get("capPlan")
                        ? selection.get("capPlan").firstWeek
                        : "2021w1",
                      null
                    )
                  }
                  disabled={!selection.get("capPlan")}
                />
              </div>
            </div>
            <div className="columns">
              <div className="column field">
                <button
                  className="button is-link is-small is-rounded"
                  onClick={handleToggle}
                  disabled={!entrySelection.checkRequired()}
                >
                  Edit Entry
                </button>
              </div>
            </div>
          </div>
        </div>

        {capacity.isGenerated() && (
          <div id={"cap-viewer"}>
            <br />
            <h2 className="is-size-5">
              Capacity Viewer{" "}
              <a className="tag ml-1 is-rounded" href={"#charts"}>
                charts <FaExternalLinkAlt className="ml-1" />
              </a>
              <a className="tag ml-1 is-rounded" href={"#grid"}>
                grid <FaExternalLinkAlt className="ml-1" />
              </a>
            </h2>
            <br />
            <CapacityViewer
              capacity={capacity.get(weekRange)}
              weeks={weeks}
              fields={data.fields.sort((a, b) => parseInt(a) - parseInt(b))}
            />

            <br />
          </div>
        )}

        {capacity.isGenerated() && (
          <div id={"charts"}>
            <h2 className="is-size-5">
              Charts{" "}
              <a className="tag ml-1 is-rounded" href={"#cap-viewer"}>
                cap-viewer <FaExternalLinkAlt className="ml-1" />
              </a>
              <a className="tag ml-1 is-rounded" href={"#grid"}>
                grid <FaExternalLinkAlt className="ml-1" />
              </a>
            </h2>
            <h3 className="has-text-centered">HC TRACKING</h3>
            <TotalPercentageChart
              data={capacity.get(weekRange)}
              lines={["billableFTE", "totalFTE", "expectedFTE"]}
              percentages={["attrPercent", "fcAttrition"]}
            />
            <br />
            <h3 className="has-text-centered">NH & TRAINING</h3>
            <TotalPercentageChart
              data={capacity.get(weekRange)}
              lines={["trainees", "nesting"]}
              bars={["trCommit"]}
            />
            <br />
          </div>
        )}

        {capacity.isGenerated() && (
          <div id={"grid"}>
            <br />
            <h2 className="is-size-5">
              Grid{" "}
              <a className="tag ml-1 is-rounded" href={"#cap-viewer"}>
                cap-viewer <FaExternalLinkAlt className="ml-1" />
              </a>
              <a className="tag ml-1 is-rounded" href={"#charts"}>
                charts <FaExternalLinkAlt className="ml-1" />
              </a>
            </h2>
            <br />
            <CapacityDataGrid
              data={capacity.get(weekRange)}
              fields={data.fields}
            />
            <br />
          </div>
        )}
      </div>
    </>
  )
}
