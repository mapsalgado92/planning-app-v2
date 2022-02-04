import { connectToDatabase } from "../../../lib/mongodb"
import { generateCapacity } from "../../../lib/capacityCalculations"
import { ObjectId } from "mongodb"

/**
METHODS: GET
PARAMS: id
BODY: payload, lob
HEADER: authorization base 64 encoded
*/

export default async function handler(req, res) {
  const { query, method } = req

  const { client, db } = await connectToDatabase()

  let toWeek = query.to
  let fromWeek = query.from
  let selected = query.selected.split(" ")

  switch (method) {
    case "GET":
      let weeks = await db
        .collection("weeks")
        .find({})
        .sort({ firstDate: 1 })
        .toArray()

      console.log(selected)

      let multiple = []

      for await (let capPlan of selected) {
        console.log(capPlan)

        let found = await db
          .collection("capPlans")
          .findOne({ _id: ObjectId(capPlan) })

        console.log(found)

        if (found) {
          let entries = await db
            .collection("capEntries")
            .find({ capPlan: capPlan })
            .toArray()

          if (weeks && toWeek) {
            weeks = weeks.slice(
              0,
              1 + weeks.indexOf(weeks.find((week) => week.code === toWeek))
            )
          }

          let capacity = await generateCapacity(capPlan, entries, weeks)

          if (capacity && fromWeek) {
            capacity = capacity.slice(
              0 + weeks.indexOf(weeks.find((week) => week.code === fromWeek))
            )
          }

          multiple.push({ capPlan: found, capacity })
        }
      }

      multiple = multiple
        .map(
          (item) =>
            item.capacity &&
            item.capacity.map((weekly) => ({
              ...weekly,
              week: weekly.week.code,
              capPlan: item.capPlan._id,
              Comment: null,
            }))
        )
        .flat()

      res.status(200).json({ message: "Capacity Generated", multiple })

      break
    default:
      res.status(405).json({ message: "Method not Allowed, use GET only" })
  }
}

/*
const aggregate = async (capPlans, fromWeek, toWeek) => {
    setAggOutput(null)
    setStatus("Aggregating...")
    let aggregated = myWeeks
      .getWeekRange(fromWeek.code, toWeek.code)
      .map((week) => {
        return { week: week, firstDate: week.firstDate.split("T")[0] }
      })

    for await (let capPlan of capPlans) {
      if (myWeeks.getWeekRange(toWeek, capPlan.firstWeek) === []) {
        console.log("Cap Plan not in Range")
        return -1
      } else {
        let capacity = await generate(capPlan, toWeek.code)

        console.log("CAPACITY", capacity)

        aggregated = await aggregated.map((agg) => {
          let weekly = capacity.find(
            (weekly) => weekly.week.code === agg.week.code
          )
          if (weekly) {
            let newAgg = { ...agg }
            data.fields.forEach((field) => {
              if (
                field.aggregatable &&
                (weekly[field.internal] || weekly[field.internal] === 0)
              ) {
                if (newAgg[field.internal] || newAgg[field.internal] === 0) {
                  newAgg[field.internal] =
                    Math.round(
                      (newAgg[field.internal] +
                        parseFloat(weekly[field.internal])) *
                        100
                    ) / 100
                } else {
                  newAgg[field.internal] =
                    Math.round(parseFloat(weekly[field.internal]) * 100) / 100

                  if (field.internal === "expectedFTE") {
                    console.log(
                      "IT WAS EXPECTED FTE",
                      weekly[field.internal],
                      newAgg[field.internal]
                    )
                    console.log(capPlan)
                  }
                  //console.log("FIRST WEEKLY", newAgg[field.internal])
                }
              }
            })

            //attrPercentException
            if (newAgg.attrition) {
              newAgg.attrPercent =
                Math.round(
                  (newAgg.attrition / (newAgg.totalHC + newAgg.attrition)) *
                    10000
                ) / 100
            }

            return newAgg
          } else {
            return agg
          }
        })
      }
    }

    //SUMS AND AVERAGES

    let sumFields = data.fields.filter((field) => field.aggSum)
    let averageFields = data.fields.filter((field) => field.aggAverage)

    //Build Sums and Average arrays

    let sums = sumFields
      ? sumFields.map((field) => {
          let newTotal = 0

          for (let i = 0; i < aggregated.length; i++) {
            newTotal += aggregated[i][field.internal] || 0
          }

          return { field, value: newTotal }
        })
      : []

    console.log("SUMS", sums)

    let averages = averageFields
      ? averageFields.map((field) => {
          let newTotal = 0

          for (let i = 0; i < aggregated.length; i++) {
            newTotal += aggregated[i][field.internal] || 0
          }

          return { field, value: newTotal / aggregated.length }
        })
      : []

    console.log("AVERAGES", averages)

    //Special Case attrition %

    let attritionSum = sums.find((sum) => sum.field.internal === "attrition")

    let totalHCAvg = averages.find((avg) => avg.field.internal === "totalHC")

    let attritionRate = {
      field: data.fields.find((field) => field.internal === "attrPercent"),
      value: null,
    }

    if (attritionSum && totalHCAvg) {
      attritionRate.value = attritionSum.value / totalHCAvg.value
    } else {
      attritionRate.value = 0
    }

    console.log("ATTR RATE", attritionRate.value * 100, "%")

    //Special Case Training Attrition %

    let trAttritionRate = {
      field: {
        internal: "trAttritionRate",
        external: "Tr. Attrition Rate",
        _id: "trAttrition-id",
      },
      value:
        sums.find((sum) => sum.field.internal === "trAttrition").value /
        (sums.find((sum) => sum.field.internal === "trCommit").value +
          sums.find((sum) => sum.field.internal === "trGap").value),
    }

    let ocpAttritionRate = {
      field: {
        internal: "ocpAttritionRate",
        external: "OCP Attrition Rate",
        _id: "ocpAttrition-id",
      },
      value:
        sums.find((sum) => sum.field.internal === "ocpAttrition").value /
        (sums.find((sum) => sum.field.internal === "trCommit").value +
          sums.find((sum) => sum.field.internal === "trGap").value),
    }

    setAggTotals({
      sums,
      averages,
      calculated: [attritionRate, trAttritionRate, ocpAttritionRate],
    })
    setAggOutput(aggregated)
    setStatus(null)
  }
  */
