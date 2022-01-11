import { useState, useEffect } from "react"
import ReactTooltip from "react-tooltip"
import { FaExclamationCircle } from "react-icons/fa"

const CapacityViewer = ({ capacity, fields, weeks }) => {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])
  return (
    <div className="columns is-gapless is-size-7">
      <div className="column is-narrow table-container has-text-right">
        <table className="table">
          <thead>
            <tr>
              <th className="is-dark">CAPACITY VIEW</th>
            </tr>
          </thead>
          <tfoot>
            <tr>
              <th className="is-dark">CAPACITY VIEW</th>
            </tr>
          </tfoot>
          <tbody>
            {fields &&
              fields.map((field) => (
                <tr>
                  <th
                    className={
                      field.type === "capacity" ? "has-text-danger" : ""
                    }
                  >
                    {field.external + " ->"}
                  </th>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="column table-container ml-1">
        <table className="table is-striped is-hoverable">
          <thead>
            <tr>
              {capacity &&
                capacity.map((weekly) => {
                  console.log(weekly)
                  return (
                    <th className="is-dark" style={{ whiteSpace: "nowrap" }}>
                      <div className="mx-auto">
                        {isMounted && (
                          <ReactTooltip
                            id={"comment" + weekly.firstDate}
                            effect={"solid"}
                            html={true}
                          />
                        )}
                        {weekly.firstDate}
                        <FaExclamationCircle
                          className={`ml-2 ${
                            weekly.Comment ? "has-text-white" : "has-text-grey"
                          }`}
                          data-tip={
                            weekly.Comment &&
                            weekly.Comment.split("\n").join("<br/>")
                          }
                          data-for={"comment" + weekly.firstDate}
                        />
                      </div>
                    </th>
                  )
                })}
            </tr>
          </thead>
          <tfoot>
            <tr>
              {capacity &&
                capacity.map((weekly) => {
                  console.log(weekly)
                  return (
                    <th className="is-dark" style={{ whiteSpace: "nowrap" }}>
                      {weekly.firstDate}
                    </th>
                  )
                })}
            </tr>
          </tfoot>
          <tbody>
            {fields &&
              fields.map((field) => (
                <tr>
                  {capacity &&
                    capacity.map((weekly) => (
                      <td style={{ whiteSpace: "nowrap", textAlign: "center" }}>
                        {weekly[field.internal] ? (
                          Math.round(weekly[field.internal] * 1000) / 1000
                        ) : weekly[field.internal] === 0 ? (
                          <span className="has-text-primary">0</span>
                        ) : (
                          <span className="has-text-light">#</span>
                        )}
                      </td>
                    ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CapacityViewer
