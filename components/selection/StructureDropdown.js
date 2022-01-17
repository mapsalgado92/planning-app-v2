import { useEffect, useState } from "react"

const StructureDropdown = ({
  structureName,
  data,
  disabled,
  selection,
  form,
  callback,
  reset,
}) => {
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setSelected(selection.get(structureName))
  }, [selection.get("capPlan")])

  return (
    <div className="select is-small is-rounded">
      <select
        style={{ minWidth: "150px" }}
        disabled={disabled}
        onChange={(e) => {
          let json = JSON.parse(e.target.value)
          console.log(json)
          setSelected(json)

          if (reset) {
            let newSelection = {
              ...selection.getForm(),
              [structureName]: json,
            }
            reset.forEach((field) => (newSelection[field] = null))
            selection.setMany(newSelection)
          } else {
            selection.set(structureName, json)
          }
          if (callback && form) {
            callback(form, json)
          }
        }}
        value={selected ? JSON.stringify(selected) : `Select ${structureName}`}
      >
        {!selected && <option value={null}>{`Select ${structureName}`}</option>}
        {data &&
          data.map((item, index) => (
            <option key={"selection-" + item._id} value={JSON.stringify(item)}>
              {item.name}
            </option>
          ))}
      </select>
    </div>
  )
}

export default StructureDropdown
