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

	let recent = []

	if (!current.entry) {
		current.entry = {}
	}

	//FIRST CURRENT

	current.trWeeks = parseInt(current.entry.trWeeks)
	current.ocpWeeks = parseInt(current.entry.ocpWeeks)
	current.billableFTE = parseInt(current.entry.billable)
	current.budgetFTE = parseInt(current.entry.budget)
	current.fcTrAttrition = parseFloat(current.entry.fcTrAttrition)
	current.requiredFTE = parseFloat(current.entry.required)

	current.pShrinkage = current.entry.pShrinkage

	let newPlan = weeks.map((week) => {
		let entry = entries.find((entry) => entry.week === week.code)

		let newRecentItem = {
			week: week.code,
			totalFTE: current.totalFTE,
			actAttrition: entry ? parseInt(entry.attrition) || 0 : 0,
			fcAttrition: entry
				? (parseFloat(entry.fcAttrition) || 0) * parseFloat(current.totalFTE)
				: 0,
		}

		if (newRecentItem.actAttrition > 0 && newRecentItem.fcAttrition === 0) {
			newRecentItem.fcAttrition = newRecentItem.actAttrition
		}

		let newPlanWeek = {
			firstDate: week.firstDate.toISOString().split("T")[0],
			totalHC: current.totalHC,
			totalFTE: current.totalFTE,
			billableFTE: current.billableFTE,
			budgetFTE: current.budgetFTE,
			fcFTE: current.fcFTE,
			requiredFTE: current.requiredFTE,
			trainees: 0,
			nesting: 0,
			//Staffing
			pAHT: current.pAHT,
			pVolumes: current.pVolumes,
			pEmVolumes: current.pEmVolumes,
			pEmAHT: current.pEmAHT,
			pSL: current.pSL,
			pOccupancy: current.pOccupancy,
			pTT: current.pTT,
			pASA: current.pASA,
		}
		newPlanWeek.hasShrinkage = false
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
				Math.round((entry.attrition / current.totalFTE) * 10000) / 100
		}

		let sumActAttrition = 0
		let sumFcAttrition = 0

		recent.forEach((item) => {
			sumActAttrition += item.actAttrition || 0
			sumFcAttrition += item.fcAttrition || 0
		})

		let relativeAttrTrend = 1

		if (sumFcAttrition > 0) {
			relativeAttrTrend = Math.max(0.2, sumActAttrition / sumFcAttrition)
		}

		if (entry && entry.fcAttrition) {
			newPlanWeek.fcAttrition =
				Math.round(parseFloat(entry.fcAttrition) * 1000) / 10
			newPlanWeek.expectedAttrition =
				Math.round(newPlanWeek.fcAttrition * relativeAttrTrend * 100) / 100
			if (current.isFuture) {
				newPlanWeek.expectedFTE =
					Math.round(
						newPlanWeek.expectedFTE *
							(1 - newPlanWeek.expectedAttrition / 100) *
							100
					) / 100
			}
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

		if (entry && entry.budget) {
			newPlanWeek.budgetFTE = parseFloat(entry.budget)
		}

		if (entry && entry.required) {
			newPlanWeek.requiredFTE = parseFloat(entry.required)
		}

		if (entry && entry.forecasted) {
			newPlanWeek.fcFTE = parseFloat(entry.forecasted)
		}

		if (entry && entry.pAHT) {
			newPlanWeek.pAHT = parseFloat(entry.pAHT)
		}

		if (entry && entry.pVolumes) {
			newPlanWeek.pVolumes = parseFloat(entry.pVolumes)
		}

		if (entry && entry.pSL) {
			newPlanWeek.pSL = parseFloat(entry.pSL)
		}

		if (entry && entry.pOccupancy) {
			newPlanWeek.pOccupancy = parseFloat(entry.pOccupancy)
		}

		if (entry && entry.pTT) {
			newPlanWeek.pTT = parseFloat(entry.pTT)
		}

		if (entry && entry.pASA) {
			newPlanWeek.pASA = parseFloat(entry.pASA)
		}

		if (entry && entry.pEmAHT) {
			newPlanWeek.pEmAHT = parseFloat(entry.pEmAHT)
		}

		if (entry && entry.pEmVolumes) {
			newPlanWeek.pEmVolumes = parseFloat(entry.pEmVolumes)
		}

		if (entry && entry.pShrinkage && entry.pShrinkage.length) {
			current.pShrinkage = entry.pShrinkage
			newPlanWeek.hasShrinkage = true
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

				if (newPlanWeek.expectedFTE !== undefined) {
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

		if (thisWeek && week.code === thisWeek.code) {
			current.isFuture = true
		}

		//Set up SHRINKGAGE

		if (current.pShrinkage) {
			let newShrink = {
				aux: 0,
				abs: 0,
				off: 0,
			}

			current.pShrinkage.forEach((shrink) => {
				newShrink[shrink.mapping] += parseFloat(shrink.percentage)
			})

			newPlanWeek.pAbs = newShrink.abs
			newPlanWeek.pAux = newShrink.aux
			newPlanWeek.pOff = newShrink.off
		}

		//Calculations
		current.billableFTE &&
			(newPlanWeek.expectedFTE
				? (newPlanWeek.billVar =
						newPlanWeek.expectedFTE - newPlanWeek.billableFTE)
				: (newPlanWeek.billVar =
						newPlanWeek.totalFTE - newPlanWeek.billableFTE))

		current.requiredFTE &&
			(newPlanWeek.expectedFTE
				? (newPlanWeek.reqVar =
						newPlanWeek.expectedFTE - newPlanWeek.requiredFTE)
				: (newPlanWeek.reqVar = newPlanWeek.totalFTE - newPlanWeek.requiredFTE))

		current.fcFTE &&
			(newPlanWeek.expectedFTE
				? (newPlanWeek.fcVar = newPlanWeek.expectedFTE - newPlanWeek.fcFTE)
				: (newPlanWeek.fcVar = newPlanWeek.totalFTE - newPlanWeek.fcFTE))

		current = { ...current, ...newPlanWeek }

		//Build RECENT
		if (!current.isFuture) {
			recent.push(newRecentItem)

			if (recent.length === 15) {
				newPlanWeek.expectedFTE
				recent = recent.slice(1)
			}
		}

		//RETURN

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
