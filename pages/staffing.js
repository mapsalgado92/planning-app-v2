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

  const [view, setView] = useState({})

  const [shrinkage, setShrinkage] = useState([])

  const [volumesAndAHT, setVolumesAndAHT] = useState([])

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
      alert("Could not generate capacity!")
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

    let capPlan = selection.get("capPlan")

    let channels = capPlan.staffing.channels

    if (!channels) {
      alert("No Valid Channels on Cap Plan")
    }

    let requirementsArr = channels.map((channel) => {
      if (channel.live === "TRUE") {
        if (!channel.distros) {
          alert("Missing Distros in Channel!")
          return {
            ...channel,
            data: [],
            values: {},
          }
        }
        let liveRequirements = erlang.generateLiveRequirements({
          distros: channel.distros,
          vol: extracted[`${channel.name}.pVolumes`],
          aht: extracted[`${channel.name}.pAHT`],
          targets: {
            sl: channel.sl,
            occ: channel.occ,
            tt: channel.tt,
            conc: channel.conc,
          },
          abs: parseFloat(extracted.pAbs) / 100 || 0,
          aux: parseFloat(extracted.pAux) / 100 || 0,
          off: parseFloat(extracted.pOff) / 100 || 0,
          absFromTotal: capPlan.staffing.absFromTotal,
        })
        return {
          ...channel,
          data: liveRequirements,
          values: erlang.getWeeklyValues(
            liveRequirements,
            capPlan.staffing.fteHours,
            capPlan.staffing.blendOcc
          ),
        }
      } else if (channel.live === "FALSE") {
        let boRequirements = erlang.generateBORequirements({
          vol: extracted[`${channel.name}.pVolumes`],
          aht: extracted[`${channel.name}.pAHT`],
          abs: parseFloat(extracted.pAbs) / 100 || 0,
          aux: parseFloat(extracted.pAux) / 100 || 0,
          off: parseFloat(extracted.pOff) / 100 || 0,
          absFromTotal: capPlan.staffing.absFromTotal,
          occ: capPlan.staffing.blendOcc || 0,
        })

        return {
          ...channel,
          data: boRequirements,
          values: erlang.getWeeklyValues(
            boRequirements,
            capPlan.staffing.fteHours,
            capPlan.staffing.blendOcc
          ),
        }
      } else {
        alert("Invalid Channel Type")
      }
    })

    let liveBoltOnData = erlang.boltOnRequirements(
      requirementsArr
        .filter((item) => item.live === "TRUE")
        .map((item) => item.data)
    )

    let liveTotalRealSurplus =
      requirementsArr
        .filter((item) => item.live === "TRUE")
        .reduce(
          (partialSum, item) => partialSum + item.values.totalRealSurplus || 0,
          0
        ) || 0

    let offlineTotalReq =
      requirementsArr
        .filter((item) => item.live === "FALSE")
        .reduce(
          (partialSum, item) => partialSum + item.values.totalReq || 0,
          0
        ) || 0

    let boltOnRequirements = {
      name: "Bolt On",
      live: "TRUE",
      data: liveBoltOnData,
      values: erlang.getWeeklyValues(liveBoltOnData, capPlan.staffing.fteHours),
    }

    boltOnRequirements.values.totalReq += offlineTotalReq
    boltOnRequirements.values.totalRealSurplus = liveTotalRealSurplus

    let blendedRequirmenets = {
      name: "Blended",
      live: "TRUE",
      data: liveBoltOnData,
      values: erlang.getWeeklyValues(liveBoltOnData, capPlan.staffing.fteHours),
    }

    if (offlineTotalReq > liveTotalRealSurplus) {
      blendedRequirmenets.values.totalReq +=
        offlineTotalReq - liveTotalRealSurplus
      blendedRequirmenets.values.totalRealSurplus === 0
    } else {
      blendedRequirmenets.values.totalRealSurplus =
        liveTotalRealSurplus - offlineTotalReq
    }

    blendedRequirmenets.values.totalSurplus = "N/A"

    let requirements = [
      ...requirementsArr,
      boltOnRequirements,
      blendedRequirmenets,
    ]

    setView({
      requirements: requirements,
      weekly: extracted,
      selected: "agents",
      type: "req",
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
                    !selection.get("capPlan").staffing.channels ||
                    !capacity.isGenerated()
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

            <br></br>

            <div className="has-text-right">
              <label className="label">Planned Vol & AHT</label>
              <CSVUploader
                removeHandler={() => setVolumesAndAHT([])}
                loadedHandler={(csv) => setVolumesAndAHT(csv)}
                label={"channel - volumes - aht"}
              ></CSVUploader>
              <button
                className="button is-small is-link is-rounded"
                onClick={() => {
                  handleSubmit({
                    capPlan: selection.get("capPlan")._id,
                    week: selection.get("week").code,
                    planned: volumesAndAHT,
                  })
                }}
                disabled={!selection.get("capPlan") || !locked}
              >
                Update Planned Vol & AHT
              </button>
              <button
                className="button is-small is-info is-rounded"
                onClick={() => {
                  handleSubmit({
                    capPlan: selection.get("capPlan")._id,
                    week: selection.get("week").code,
                    actual: volumesAndAHT,
                  })
                }}
                disabled={!selection.get("capPlan") || !locked}
              >
                Update Actual Vol & AHT
              </button>
            </div>
          </div>
        </div>
        <br></br>

        {view.type === "req" && view.requirements ? (
          <>
            {view.requirements.map((channel) =>
              channel.live === "TRUE" ? (
                <div>
                  <div className="columns">
                    <div className="column is-narrow">
                      <br></br>

                      <br></br>
                      <label className="label has-text-danger">
                        {channel.name + " Requirements"}
                      </label>
                      <ul>
                        <li>
                          Total Requirement:{" "}
                          <span className="has-text-link">
                            {Math.round(channel.values.totalReq * 10) / 10}
                          </span>
                        </li>

                        {channel.values.peakReq && (
                          <>
                            <li>
                              Peak Requirement:{" "}
                              <span className="has-text-danger">
                                {Math.round(
                                  (channel.values.peakReq.scheduled.agents ||
                                    channel.values.peakReq.scheduled.agents) *
                                    10
                                ) / 10}
                              </span>{" "}
                            </li>
                            <li>
                              Peak Time:{" "}
                              <span className="has-text-primary">
                                {channel.values.peakReq.interval}, Weekday{" "}
                                {channel.values.peakReq.weekday}
                              </span>
                            </li>
                          </>
                        )}
                        <li>
                          Surplus:{" "}
                          <span className="has-text-success">
                            {Math.round(channel.values.totalSurplus * 10) /
                              10 || channel.values.totalSurplus}
                          </span>
                        </li>
                        <li>
                          Real Surplus (w/ Blend Occ):{" "}
                          <span className="has-text-success">
                            {Math.round(channel.values.totalRealSurplus * 10) /
                              10 || channel.values.totalSurplus}
                          </span>
                        </li>
                        <br></br>
                      </ul>
                      <br></br>
                      <label className="label">Volumes & Targets</label>
                      <ul>
                        <li>
                          Volumes:{" "}
                          {Math.round(
                            view.weekly[channel.name + ".pVolumes"]
                          ) || "N/A"}
                        </li>
                        <li>
                          AHT:{" "}
                          {Math.round(view.weekly[channel.name + ".pAHT"]) ||
                            "N/A"}
                        </li>
                        <li>
                          SL: {channel.sl ? channel.sl * 100 + "%" : "N/A"}
                        </li>
                        <li>TT: {channel.tt ? channel.tt + '"' : "N/A"}</li>
                        <li>
                          Occupancy:{" "}
                          {channel.occ ? channel.occ * 100 + "%" : "N/A"}
                        </li>
                        <li>
                          Concurrency: {channel.conc ? channel.conc : "N/A"}
                        </li>
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
                      <div>
                        <div className="field">
                          <button
                            className={`button is-small is-rounded is-light ${
                              view.selected === "agents" && "is-primary"
                            }`}
                            onClick={() =>
                              setView({ ...view, selected: "agents" })
                            }
                          >
                            Agents
                          </button>

                          <button
                            className={`button is-small is-rounded is-light ${
                              view.selected === "volumes" && "is-primary"
                            }`}
                            onClick={() =>
                              setView({ ...view, selected: "volumes" })
                            }
                          >
                            Volumes
                          </button>

                          <button
                            className={`button is-small is-rounded is-light ${
                              view.selected === "aht" && "is-primary"
                            }`}
                            onClick={() =>
                              setView({ ...view, selected: "aht" })
                            }
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
                            onClick={() =>
                              setView({ ...view, selected: "occupancy" })
                            }
                          >
                            Occupancy
                          </button>
                          <button
                            className={`button is-small is-rounded is-light ${
                              view.selected === "surplus" && "is-primary"
                            }`}
                            onClick={() =>
                              setView({ ...view, selected: "surplus" })
                            }
                          >
                            Surplus
                          </button>
                        </div>
                      </div>
                      <br></br>
                      <div style={{ maxHeight: "90vh", overflowY: "scroll" }}>
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
                            ...new Set(
                              channel.data.map((item) => item.interval)
                            ),
                          ]}
                          data={channel.data.map((item) => {
                            return { ...item, ...item.net }
                          })}
                          value={view.selected}
                        />
                      </div>
                      <br></br>
                      <br></br>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <br></br>
                  <div className="columns ">
                    <div className=" column is-narrow mr-5">
                      <label className="label has-text-danger">
                        {channel.name + " Requirements"}
                      </label>
                      <ul>
                        <li>
                          Total Requirement:{" "}
                          <span className="has-text-link">
                            {Math.round(channel.values.totalReq * 10) / 10}
                          </span>
                        </li>
                        <li>
                          Total Hours:{" "}
                          <span className="has-text-danger">
                            {Math.round(channel.values.totalHours * 10) / 10}
                          </span>
                        </li>
                        <li>
                          Net Hours:{" "}
                          <span className="has-text-primary">
                            {Math.round(channel.values.netHours * 10) / 10}
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="column is-narrow mr-5">
                      <label className="label">Volumes & Targets</label>
                      <ul>
                        <li>
                          Volumes:{" "}
                          {Math.round(
                            view.weekly[channel.name + ".pVolumes"]
                          ) || "N/A"}
                        </li>
                        <li>
                          AHT:{" "}
                          {Math.round(view.weekly[channel.name + ".pAHT"]) ||
                            "N/A"}
                        </li>
                        <li>
                          SL: {channel.sl ? channel.sl * 100 + "%" : "N/A"}
                        </li>
                        <li>TT: {channel.tt ? channel.tt + '"' : "N/A"}</li>
                        <li>
                          Occupancy:{" "}
                          {channel.occ ? channel.occ * 100 + "%" : "N/A"}
                        </li>
                        <li>
                          Concurrency: {channel.conc ? channel.conc : "N/A"}
                        </li>
                      </ul>
                    </div>
                    <div className=" column is-narrow">
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
                  </div>
                  <br></br>
                  <br></br>
                  <br></br>
                </div>
              )
            )}
          </>
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
