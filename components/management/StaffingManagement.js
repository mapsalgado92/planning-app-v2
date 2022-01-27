import { useState } from "react"
import { useAuth } from "../../contexts/authContext"
import useForm from "../../hooks/useForm"
import StructureDropdown from "../selection/StructureDropdown"

import { FaLock } from "react-icons/fa"
import CSVUploader from "../files/CSVUploader"
import Heatmap from "../staffing/heatmap"

const selectionFields = [
  { name: "project", default: null, required: true, type: "object", level: 1 },
  { name: "lob", default: null, required: true, type: "object", level: 2 },
  { name: "capPlan", default: null, required: true, type: "object", level: 3 },
]

const formFields = [
  {
    name: "auxDist",
    default: false,
    required: true,
    type: "check",
    label: "Aux Dist",
  },
  {
    name: "absFromTotal",
    default: true,
    required: false,
    type: "check",
    label: "ABS from Total",
  },
  {
    name: "fteHours",
    default: 40,
    required: false,
    type: "number",
    label: "Number of hours for one FTE",
  },
  {
    name: "interval",
    default: 900,
    required: false,
    type: "number",
    label: "Number of seconds on the base interval",
  },
]

const StaffingManagement = ({ data }) => {
  const [distros, setDistros] = useState([])
  const [shrinkage, setShrinkage] = useState([])

  const auth = useAuth()

  const selection = useForm({
    fields: selectionFields,
  })

  const form = useForm({
    fields: formFields,
  })

  //HANDLERS
  const handleSubmit = async (payload) => {
    await fetch(
      `/api/data/management/capPlan?id=${
        selection.get("capPlan") && selection.get("capPlan")._id
      }`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth.authorization(),
        },
        body: JSON.stringify({ payload }),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message)
      })
      .catch((err) => console.log(err))

    data.refresh()
    selection.resetOne("capPlan")
  }

  return (
    <>
      {auth.permission(2) ? (
        <div>
          <div id="selection" className="columns">
            <div className="column is-12 field">
              <label className="label">Selection</label>
              <StructureDropdown
                structureName="project"
                selection={selection}
                form={form}
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
                form={form}
                data={
                  data &&
                  selection.get("project") &&
                  data.lobs.filter(
                    (lob) => lob.project === selection.get("project")._id
                  )
                }
                disabled={!selection.get("project")}
                reset={["capPlan"]}
                callback={(f) => {
                  f.resetAll()
                }}
              />
              <StructureDropdown
                structureName="capPlan"
                selection={selection}
                form={form}
                data={
                  data &&
                  selection.get("lob") &&
                  data.capPlans.filter(
                    (capPlan) => capPlan.lob === selection.get("lob")._id
                  )
                }
                disabled={!selection.get("lob")}
                callback={(f, s) => {
                  if (s.staffing) {
                    f.setMany({
                      auxDist: s.staffing.auxDist,
                      absFromTotal: s.staffing.absFromTotal,
                      fteHours: s.staffing.fteHours,
                      interval: s.staffing.interval,
                    })
                  } else {
                    f.resetAll()
                  }
                }}
              />
            </div>
          </div>

          <div className="columns is-multiline">
            <div className="column is-half ">
              <label className="label">Configuration</label>
              <div className="field is-small is-grouped">
                <input
                  type="number"
                  className="input is-small mx-1 is-rounded "
                  style={{ maxWidth: "7em" }}
                  value={form.get("fteHours") || ""}
                  onChange={(e) => {
                    form.set("fteHours", e.target.value)
                  }}
                  disabled={!selection.get("capPlan")}
                  placeholder="FTE Hours"
                ></input>
                <label className="label is-size-6">FTE Hours</label>
              </div>
              <div className="field is-small is-grouped">
                <input
                  type="number"
                  className="input is-small mx-1 is-rounded "
                  style={{ maxWidth: "7em" }}
                  value={form.get("interval") || ""}
                  onChange={(e) => {
                    form.set("interval", e.target.value)
                  }}
                  disabled={!selection.get("capPlan")}
                  placeholder="Interval"
                ></input>
                <label className="label is-size-6">Interval</label>
              </div>
              <div className="control ">
                <label className="label ">
                  <input
                    type="checkbox"
                    className="mx-2 "
                    checked={form.get("auxDist") || false}
                    onChange={() => {
                      form.set("auxDist", !form.get("auxDist"))
                    }}
                    disabled={!selection.get("capPlan")}
                  ></input>
                  Uses Aux Dist?
                </label>
              </div>
              <div className="control">
                <label className="label">
                  <input
                    type="checkbox"
                    className="mx-2"
                    checked={form.get("absFromTotal") || false}
                    onChange={() => {
                      form.set("absFromTotal", !form.get("absFromTotal"))
                    }}
                    disabled={!selection.get("capPlan")}
                  ></input>
                  ABS relative to Total?
                </label>
              </div>
              <br></br>

              <div id="update-button">
                <button
                  className="button is-small is-success is-rounded"
                  onClick={() =>
                    handleSubmit({
                      staffing: {
                        ...(selection.get("capPlan")
                          ? selection.get("capPlan").staffing
                          : {}),
                        ...form.getForm(),
                      },
                    })
                  }
                  disabled={!selection.get("capPlan")}
                >
                  Update Config
                </button>
              </div>
            </div>
            <div className="column is-half has-text-right">
              <label className="label">Distributions</label>
              <CSVUploader
                removeHandler={() => setDistros([])}
                loadedHandler={(csv) => setDistros(csv)}
                label={
                  "interval (####) - weekday (DDD) - vDist (0.###) - ahtDist (#.# relative) - auxDist (0.###)"
                }
              ></CSVUploader>
              <button
                className="button is-small is-link is-rounded"
                onClick={() => {
                  handleSubmit({
                    staffing: {
                      ...(selection.get("capPlan")
                        ? selection.get("capPlan").staffing
                        : {}),
                      distros,
                    },
                  })
                }}
                disabled={!selection.get("capPlan") || !distros}
              >
                Update Distros
              </button>

              <br></br>
              <br></br>

              <label className="label">Shrinkage</label>
              <CSVUploader
                removeHandler={() => setShrinkage([])}
                loadedHandler={(csv) => setShrinkage(csv)}
                label={
                  "aux (AUX #, Vacation, Extra Day Off...) - mapped (OFF, ABS or AUX)"
                }
              ></CSVUploader>
              <button
                className="button is-small is-link is-rounded"
                onClick={() => {
                  handleSubmit({
                    staffing: {
                      ...(selection.get("capPlan")
                        ? selection.get("capPlan").staffing
                        : {}),
                      shrinkage,
                    },
                  })
                }}
                disabled={!selection.get("capPlan") || !shrinkage}
              >
                Update Shrinkage
              </button>
            </div>

            {selection.get("capPlan") &&
              selection.get("capPlan").staffing &&
              selection.get("capPlan").staffing.distros && (
                <div className="column is-half is-size-7 has-text-centered">
                  <h2>VOLUMES</h2>
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
                        selection
                          .get("capPlan")
                          .staffing.distros.map((item) => item.interval)
                      ),
                    ]}
                    data={selection
                      .get("capPlan")
                      .staffing.distros.map((item) => ({
                        ...item,
                        vDist: item.vDist * 100,
                      }))}
                    value={"vDist"}
                    max={Math.max(
                      ...selection
                        .get("capPlan")
                        .staffing.distros.map((item) =>
                          item.vDist ? item.vDist * 100 : 0
                        )
                    )}
                  />
                </div>
              )}
            {selection.get("capPlan") &&
              selection.get("capPlan").staffing &&
              selection.get("capPlan").staffing.distros && (
                <div className="column is-half is-size-7 has-text-centered">
                  <h2>AHT</h2>
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
                        selection
                          .get("capPlan")
                          .staffing.distros.map((item) => item.interval)
                      ),
                    ]}
                    data={selection.get("capPlan").staffing.distros}
                    value={"ahtDist"}
                    max={Math.max(
                      ...selection
                        .get("capPlan")
                        .staffing.distros.map((item) =>
                          item.ahtDist ? item.ahtDist : 0
                        )
                    )}
                  />
                </div>
              )}
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
