import { createContext, useContext, useState, useEffect } from "react"

const WeeksContext = createContext()

export const WeeksProvider = ({ children }) => {
  const [weeks, setWeeks] = useState([])
  const [current, setCurrent] = useState(null)
  const [next12, setNext12] = useState(null)
  const [prev12, setPrev12] = useState(null)

  useEffect(() => {
    fetch("/api/data/structures?selected=weeks")
      .then((res) => res.json())
      .then((fetched) => {
        console.log(fetched.message)
        if (fetched.data.weeks) {
          weeks = fetched.data.weeks
          weeks.sort((a, b) => {
            return a.year > b.year
              ? 1
              : a.year < b.year
              ? -1
              : a.weekNum - b.weekNum
          })
          setWeeks(weeks)
          let currentDate = new Date()
          for (let index in weeks) {
            if (currentDate.toISOString() < weeks[index].firstDate) {
              setCurrent(weeks[index - 1])
              setNext12(weeks[index - -11])
              setPrev12(weeks[index - 13])
              break
            }
          }
        }
      })
      .catch()
  }, [])

  const getRange = (fromWeek, toWeek) => {
    if (toWeek) {
      return weeks.slice(
        weeks.indexOf(getWeek({ value: fromWeek, type: "code" })),
        1 + data.weeks.indexOf(getWeek({ value: toWeek, type: "code" }))
      )
    } else {
      return weeks.slice(
        data.weeks.indexOf(getWeek({ value: fromWeek, type: "code" }))
      )
    }
  }

  const getMonth = (week) => {
    return week.firstDate.split("T")[0].split("-")[2]
  }

  const getWeek = ({ value, type }) => {
    return weeks.find((week) => week[type] === value)
  }

  return (
    <WeeksContext.Provider
      value={{ weeks, current, next12, prev12, getRange, getWeek }}
    >
      {children}
    </WeeksContext.Provider>
  )
}

export function useWeeks() {
  return useContext(WeeksContext)
}
