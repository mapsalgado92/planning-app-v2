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
import Heatmap from "../components/staffing/heatmap"

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

  const [view, setView] = useState({
    type: null,
  })

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
      setView({
        type: null,
      })
      setLocked(false)
    } else if (selection.get("capPlan").staffing) {
      erlang.updateInterval(selection.get("capPlan").staffing.interval || 900)
      capacity.generate(selection.get("capPlan"))
      setLocked(true)
    } else {
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

  const handleGenerateRequirements = () => {
    let extracted = capacity.get([selection.get("week")])[0]
    let requirements = erlang.generateRequirements({
      distros: selection.get("capPlan").staffing.distros,
      vol: parseFloat(extracted.pVolumes) || 0,
      aht: parseFloat(extracted.pAHT) || 0,
      targets: {
        sl: parseFloat(extracted.pSL) || 0.8,
        occ: parseFloat(extracted.pOccupancy) || 0.8,
        tt: parseFloat(extracted.pTT) || 0.2,
        asa: 0,
      },
      abs: parseFloat(extracted.pAbs) / 100,
      aux: parseFloat(extracted.pAux) / 100,
      off: parseFloat(extracted.pOff) / 100,
      absFromTotal: selection.get("capPlan").staffing.absFromTotal,
    })

    console.log(requirements)

    setView({
      type: "req",
      data: requirements,
      weekly: extracted,
      values: erlang.getWeeklyValues(
        requirements,
        selection.get("capPlan").staffing.fteHours
      ),
      selected: "agents",
    })
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
                  disabled={locked}
                />
                <button
                  className="button is-small is-rounded is-info"
                  onClick={() => selection.set("week", weeks.getCurrentWeek())}
                  disabled={locked}
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
                  disabled={!selection.checkRequired() && !locked}
                >
                  {locked ? "UNLOCK" : "LOCK"}
                </button>

                <button
                  className={`button is-light is-small is-rounded`}
                  onClick={handleGenerateRequirements}
                  disabled={
                    !selection.checkRequired ||
                    !locked ||
                    !selection.get("capPlan") ||
                    !selection.get("capPlan").staffing ||
                    !selection.get("capPlan").staffing.distros
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
        <br></br>
        {view.type === "req" && view.values && view.data ? (
          <div>
            <div className="columns">
              <div className="column is-narrow">
                <br></br>

                <br></br>
                <label className="label has-text-danger">
                  Requirement Values
                </label>
                <ul>
                  <li>
                    Total Requirement:{" "}
                    <span className="has-text-link">
                      {Math.round(view.values.totalReq * 10) / 10}
                    </span>
                  </li>
                  <li>
                    Peak Requirement:{" "}
                    <span className="has-text-danger">
                      {Math.round(view.values.peakReq.scheduled.agents * 10) /
                        10}
                    </span>{" "}
                  </li>
                  <li>
                    Peak Time:{" "}
                    <span className="has-text-primary">
                      {view.values.peakReq.interval}, Weekday{" "}
                      {view.values.peakReq.weekday}
                    </span>
                  </li>
                </ul>
                <br></br>
                <label className="label">Volumes & Targets</label>
                <ul>
                  <li>Volumes: {Math.round(view.weekly.pVolumes)}</li>
                  <li>AHT: {Math.round(view.weekly.pAHT)}</li>
                  <li>SL Target: {view.weekly.pSL}</li>
                </ul>
                <br></br>
                <label className="label">Shrinkage</label>
                <ul>
                  <li>AUX: {view.weekly.pAux} % of Logged</li>
                  <li>
                    ABS: {view.weekly.pAbs} % of{" "}
                    {selection.get("capPlan") &&
                    selection.get("capPlan").staffing &&
                    selection.get("capPlan").staffing.absFromTotal
                      ? "Total"
                      : "Scheduled"}
                  </li>
                  <li>OFF: {view.weekly.pOff} % of Total</li>
                </ul>
              </div>
              <div className="column has-text-centered">
                <div className="field">
                  <button
                    className={`button is-small is-rounded is-light ${
                      view.selected === "agents" && "is-primary"
                    }`}
                    onClick={() => setView({ ...view, selected: "agents" })}
                  >
                    Requirement
                  </button>
                  <button
                    className={`button is-small is-rounded is-light ${
                      view.selected === "volumes" && "is-primary"
                    }`}
                    onClick={() => setView({ ...view, selected: "volumes" })}
                  >
                    Volumes
                  </button>

                  <button
                    className={`button is-small is-rounded is-light ${
                      view.selected === "aht" && "is-primary"
                    }`}
                    onClick={() => setView({ ...view, selected: "aht" })}
                  >
                    AHT
                  </button>

                  <button
                    className={`button is-small is-rounded is-light ${
                      view.selected === "sl" && "is-primary"
                    }`}
                    onClick={() => setView({ ...view, selected: "sl" })}
                  >
                    Service Level
                  </button>
                  <button
                    className={`button is-small is-rounded is-light ${
                      view.selected === "occupancy" && "is-primary"
                    }`}
                    onClick={() => setView({ ...view, selected: "occupancy" })}
                  >
                    Occupancy
                  </button>
                </div>
                <div>
                  <Heatmap
                    xArray={[
                      { label: "SUN", value: 1 },
                      { label: "MON", value: 2 },
                      { label: "TUE", value: 3 },
                      { label: "WED", value: 4 },
                      { label: "THU", value: 5 },
                      { label: "FRI", value: 6 },
                      { label: "SAT", value: 7 },
                    ]}
                    xField="weekday"
                    yField="interval"
                    yArray={[
                      ...new Set(view.data.map((item) => item.interval)),
                    ]}
                    data={view.data.map((item) => {
                      return { ...item, ...item.scheduled }
                    })}
                    value={view.selected}
                    max={Math.max(
                      ...view.data.map((item) =>
                        item.scheduled ? item.scheduled[view.selected] : 0
                      )
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : view.type === "res" ? (
          <></>
        ) : (
          <></>
        )}
      </div>
      <br></br>
      <br></br>
    </>
  )
}
