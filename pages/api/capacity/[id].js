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
  const { query, method, body, headers } = req

  console.log(query, method, body, headers)

  const { client, db } = await connectToDatabase()

  let toWeek = query.to
  let fromWeek = query.from
  let id = query.id

  switch (method) {
    case "GET":
      let capPlan = await db
        .collection("capPlans")
        .findOne({ _id: ObjectId(id) })

      if (!capPlan) {
        res.status(404).json({ message: "Capacity Plan not Found!" })
      }
      let entries = await db
        .collection("capEntries")
        .find({ capPlan: id })
        .toArray()

      let weeks = await db
        .collection("weeks")
        .find({})
        .sort({ firstDate: 1 })
        .toArray()

      if (weeks && toWeek) {
        weeks = weeks.slice(
          0,
          1 + weeks.indexOf(weeks.find((week) => week.code === toWeek))
        )
      }

      let capacity = generateCapacity(capPlan, entries, weeks)

      if (capacity && fromWeek) {
        capacity = capacity.slice(
          0 + weeks.indexOf(weeks.find((week) => week.code === fromWeek))
        )
      }

      res.status(200).json({ message: "Capacity Generated", capacity })

      break
    default:
      res.status(405).json({ message: "Method not Allowed, use GET only" })
  }
}
