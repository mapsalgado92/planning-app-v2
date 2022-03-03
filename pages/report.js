import Head from "next/head"
import { useState } from "react"
import useData from "../hooks/useData"
import useForm from "../hooks/useForm"
import StructureDropdown from "../components/selection/StructureDropdown"

import { FaExternalLinkAlt } from "react-icons/fa"
import useWeeks from "../hooks/useWeeks"
import useCapacity from "../hooks/useCapacity"
import WeekDropdown from "../components/selection/WeekDropdown"

const selectionFields = [
  { name: "project", default: null, required: true, type: "object", level: 1 },
  { name: "lob", default: null, required: true, type: "object", level: 2 },

  {
    name: "fromWeek",
    default: null,
    required: true,
    type: "object",
    level: 1,
  },
  { name: "toWeek", default: null, required: true, type: "object", level: 1 },
]

const Report = () => {
  const [weekRange, setWeekRange] = useState([])
  const [active, setActive] = useState(false)
  const [channelFields, setChannelFields] = useState([])

  const data = useData(["projects", "lobs", "capPlans", "languages", "fields"])

  const weeks = useWeeks()

  const capacity = useCapacity()

  const selection = useForm({
    fields: selectionFields,
  })
  const handleGenerate = () => {
    let capPlan = selection.get("capPlan")

    if (capPlan.staffing && capPlan.staffing.channels) {
      setChannelFields(
        capPlan.staffing.channels.map((channel, index) => {
          return [
            {
              internal: channel.name + ".pVolumes",
              external: `P. Volumes (${channel.name})`,
              order: 1007 + index / 10 + 1 / 100,
              type: "staffing",
            },
            {
              internal: channel.name + ".pAHT",
              external: `P. AHT (${channel.name})`,
              order: 1007 + index / 10 + 2 / 100,
              type: "staffing",
            },
            {
              internal: channel.name + ".actVolumes",
              external: `Act. Volumes (${channel.name})`,
              order: 1007 + index / 10 + 3 / 100,
              type: "staffing",
            },
            {
              internal: channel.name + ".actAHT",
              external: `Act. AHT (${channel.name})`,
              order: 1007 + index / 10 + 4 / 100,
              type: "staffing",
            },
          ]
        })
      )
    }

    capacity.generate(capPlan)
    let from = selection.get("fromWeek")
    let to = selection.get("toWeek")
    setWeekRange(weeks.getWeekRange(from.code, to.code))
  }
  return (
    <>
      <Head>
        <title>Planning App | Capacity</title>
      </Head>
      <div>
        <h1 className="has-text-centered mb-2 is-size-5">REPORT</h1>

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
                selection.get("project") && [
                  { name: "SELECT ALL" },
                  ...data.lobs.filter(
                    (lob) => lob.project === selection.get("project")._id
                  ),
                ]
              }
              disabled={!selection.get("project")}
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
              weekRange={weeks && weeks.getWeekRange("2021w1", null)}
              disabled={!selection.get("lob")}
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
              weekRange={weeks && weeks.getWeekRange("2021w1", null)}
              disabled={!selection.get("lob")}
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
                  fromWeek: weeks.getWeekRelative(parseFloat("-8")),
                  toWeek: weeks.getWeekRelative(parseFloat("16")),
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
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Report
