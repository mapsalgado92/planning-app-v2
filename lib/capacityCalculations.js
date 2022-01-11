export const generateCapacity = (capPlan, entries, weeks, fromWeek) => {
  let getCurrentWeek = () => {
    let today = new Date()
    return weeks.find((week) => week.firstDate > today)
  }

  let thisWeek = getCurrentWeek()

  let current = {
    totalHC: parseFloat(capPlan.startingHC),
    totalFTE: parseFloat(capPlan.startingHC),
    entry: entries.find((entry) => entry.week === capPlan.firstWeek),
    inTraining: [],
    isFuture: false,
  }

  if (!current.entry) {
    console.log("THIIIIIIS", entries)
    current.entry = {}
  }

  current.trWeeks = parseInt(current.entry.trWeeks)
  current.ocpWeeks = parseInt(current.entry.ocpWeeks)
  current.billableFTE = parseInt(current.entry.billable)
  current.fcTrAttrition = parseFloat(current.entry.fcTrAttrition)

  let newPlan = weeks.map((week) => {
    let entry = entries.find((entry) => entry.week === week.code)

    let newPlanWeek = {
      firstDate: week.firstDate.toISOString().split("T")[0],
      totalHC: current.totalHC,
      totalFTE: current.totalFTE,
      billableFTE: current.billableFTE,
      requiredFTE: current.requiredFTE,
      trainees: 0,
      nesting: 0,
    }

    //Set up Expected FTE

    if (current.expectedFTE !== undefined) {
      newPlanWeek.expectedFTE = current.expectedFTE
    } else if (thisWeek && thisWeek.code === week.code) {
      newPlanWeek.expectedFTE = current.totalFTE ? current.totalFTE : 0
    }

    if (entry && entry.attrition) {
      newPlanWeek.totalHC -= parseFloat(entry.attrition)
      newPlanWeek.totalFTE -= parseFloat(entry.attrition)
      newPlanWeek.expectedFTE >= 0 &&
        (newPlanWeek.expectedFTE -= parseFloat(entry.attrition))
      newPlanWeek.attrPercent =
        Math.round((entry.attrition / current.totalHC) * 10000) / 100
    }

    if (entry && entry.moveOUT) {
      newPlanWeek.totalHC -= parseFloat(entry.moveOUT)
      newPlanWeek.totalFTE -= parseFloat(entry.moveOUT)
      newPlanWeek.expectedFTE >= 0 &&
        (newPlanWeek.expectedFTE -= parseFloat(entry.moveOUT))
    }

    if (entry && entry.loaOUT) {
      newPlanWeek.totalFTE -= parseFloat(entry.loaOUT)
      newPlanWeek.expectedFTE >= 0 &&
        (newPlanWeek.expectedFTE -= parseFloat(entry.loaOUT))
    }

    if (entry && entry.rwsOUT) {
      newPlanWeek.totalFTE -= parseFloat(entry.rwsOUT)
      newPlanWeek.expectedFTE >= 0 &&
        (newPlanWeek.expectedFTE -= parseFloat(entry.rwsOUT))
    }

    if (entry && entry.moveIN) {
      newPlanWeek.totalHC += parseFloat(entry.moveIN)
      newPlanWeek.totalFTE += parseFloat(entry.moveIN)
      newPlanWeek.expectedFTE >= 0 &&
        (newPlanWeek.expectedFTE += parseFloat(entry.moveIN))
    }

    if (entry && entry.loaIN) {
      newPlanWeek.totalFTE += parseFloat(entry.loaIN)
      newPlanWeek.expectedFTE >= 0 &&
        (newPlanWeek.expectedFTE += parseFloat(entry.loaIN))
    }

    if (entry && entry.rwsIN) {
      newPlanWeek.totalFTE += parseFloat(entry.rwsIN)
      newPlanWeek.expectedFTE >= 0 &&
        (newPlanWeek.expectedFTE += parseFloat(entry.rwsIN))
    }

    if (entry && entry.comment) {
      newPlanWeek.comment = entry.comment
    }

    if (entry && entry.billable) {
      newPlanWeek.billableFTE = parseFloat(entry.billable)
    }

    if (entry && entry.trWeeks) {
      current.trWeeks = parseFloat(entry.trWeeks)
    }

    if (entry && entry.ocpWeeks) {
      current.ocpWeeks = parseFloat(entry.ocpWeeks)
    }

    if (entry && entry.trCommit) {
      current.inTraining.push({
        trCommit: parseFloat(entry.trCommit),
        trGap: entry.trGap ? parseFloat(entry.trGap) : 0,
        trAttrition: entry.trAttrition ? parseFloat(entry.trAttrition) : 0,
        ocpAttrition: entry.ocpAttrition ? parseFloat(entry.ocpAttrition) : 0,
        weeksToLive: parseFloat(current.trWeeks) + 1,
        weeksToProd: parseFloat(current.ocpWeeks) + 1,
      })
    }

    if (entry && entry.fcTrAttrition) {
      current.fcTrAttrition = parseFloat(entry.fcTrAttrition)
    }

    current.inTraining.forEach((batch) => {
      let trainingTotal = batch.trCommit + batch.trGap - batch.trAttrition

      if (batch.weeksToLive > 1) {
        newPlanWeek.trainees += trainingTotal
        batch.weeksToLive--
      } else if (batch.weeksToLive === 1) {
        newPlanWeek.totalHC += trainingTotal - batch.ocpAttrition
        newPlanWeek.totalFTE += trainingTotal - batch.ocpAttrition
        if (newPlanWeek.expectedFTE >= 0) {
          if (current.fcTrAttrition && current.isFuture) {
            newPlanWeek.expectedFTE +=
              trainingTotal * (1 - current.fcTrAttrition)
          } else {
            newPlanWeek.expectedFTE += trainingTotal
          }
        }

        batch.weeksToLive--
      }

      if (batch.weeksToLive < 1 && batch.weeksToProd > 1) {
        newPlanWeek.nesting += trainingTotal - batch.ocpAttrition
        batch.weeksToProd--
      }
    })

    if (entry && entry.fcAttrition) {
      newPlanWeek.fcAttrition =
        Math.round(parseFloat(entry.fcAttrition) * 1000) / 10
      if (current.isFuture) {
        newPlanWeek.expectedFTE =
          Math.round(
            newPlanWeek.expectedFTE * (1 - newPlanWeek.fcAttrition / 100) * 100
          ) / 100
      }
    }

    if (thisWeek && week.code === thisWeek.code) {
      current.isFuture = true
    }

    //Calculations
    newPlanWeek.billableFTE &&
      (newPlanWeek.billVar = newPlanWeek.totalFTE - newPlanWeek.billableFTE)
    newPlanWeek.expectedFTE >= 0 &&
      newPlanWeek.billableFTE &&
      (newPlanWeek.exBillVar =
        newPlanWeek.expectedFTE - newPlanWeek.billableFTE)
    newPlanWeek.requiredFTE &&
      (newPlanWeek.reqVar = newPlanWeek.totalFTE - newPlanWeek.requiredFTE)
    newPlanWeek.expectedFTE >= 0 &&
      newPlanWeek.requiredFTE &&
      (newPlanWeek.exReqVar = newPlanWeek.expectedFTE - newPlanWeek.requiredFTE)

    current = { ...current, ...newPlanWeek }

    return { ...entry, ...newPlanWeek, week }
  })

  if (fromWeek) {
    return newPlan.filter(
      (weekly) => weekly.week.firstDate >= fromWeek.firstDate
    )
  } else {
    return newPlan
  }
}
