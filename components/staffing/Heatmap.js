/**
 * yArray: ["00:00", ...]
 * yField: "interval"
 *
 * xArray: [{label: "SUN", value: 1},...]
 * xField: "weekday"
 */
const Heatmap = ({ xArray, yArray, data, value, max }) => {
  return (
    <table className="table is-fullwidth has-text-centered is-size-7">
      <thead>
        <tr>
          <th>#</th>
          {xArray && xArray.map((item) => <th>{item.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {yArray &&
          yArray.map((yItem, yIndex) => (
            <tr className="table">
              <th
                style={{
                  borderColor: "rgba(0,0,0,0)",
                }}
              >
                {yItem}
              </th>
              {xArray &&
                xArray.map((xItem, xIndex) => {
                  return (
                    <td
                      style={{
                        background: `rgba(0, 209, 178,${
                          (data[yIndex + yArray.length * xIndex][value] / max) *
                          0.8
                        })`,
                        borderColor: "rgba(0,0,0,0)",
                      }}
                    >
                      {Math.round(
                        parseFloat(
                          data[yIndex + yArray.length * xIndex][value]
                        ) * 100
                      ) / 100 || ""}
                    </td>
                  )
                })}
            </tr>
          ))}
      </tbody>
    </table>
  )
}

export default Heatmap
