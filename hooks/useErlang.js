import { useState } from "react"

const useErlang = () => {
	const [interval, setInterval] = useState(900)

	const updateInterval = (newInterval) => {
		setInterval(newInterval)
	}
	/**
   *
   * @param {Float} vol (Number of received contacts in inteval)
   * @param {Integer} n (Number of agents/lines)
   * @param {Integer} aht (Average Handling Time in seconds)
   * @param {Object} targets ({sl, tt, occ, asa}) (optional)
   * @returns {Object} {
      volumes: vol,
      agents: n,
      aht: aht,
      sl: sl,
      asa: asa,
      occupancy: occ,
      acceptable,
      message,
    }
   */
	const calculateErlang = (vol, n, aht, targets, shrink) => {
		const powOverFact = (pow, exp, fact) => {
			if (fact === 1) {
				console.log("RETURNED A", vol, n, aht)
				return a
			}
			let prod = 1
			let nExp = exp
			let nFact = fact
			while (nExp > 0 || nFact > 1) {
				//Calc Stage Prod
				if (nExp === 0) {
					prod *= 1 / nFact
				} else if (nExp >= 1) {
					prod *= pow / nFact
				}

				//Decrement NFACT & NEXP
				nExp--
				nFact--

				//Adjust NFACT & NEXP
				if (nExp < 0) {
					nExp = 0
				}
				if (nFact < 1) {
					nFact = 1
				}
			}

			return prod
		}

		if (n === 0 || vol === 0) {
			console.log("THIS HAPPENED")
			return null
		}

		let a = (vol * aht) / interval

		console.log("A", a)

		let x = powOverFact(a, n, n) * (n / (n - a))

		//console.log("X", x)

		let y = 0

		for (let i = 0; i < n; i++) {
			y += powOverFact(a, i, i)
		}

		//console.log("Y", y)

		let pw = x / (y + x)

		//console.log("PW", pw)

		let sl = 1 - pw * Math.exp((-(n - a) * targets.tt) / aht)

		if (sl < 0) {
			sl = 0
		}

		console.log("SL", sl)

		let occ = a / n

		if (occ > 1) {
			occ = 1
		}

		//console.log("Occ", occ)

		let asa = (pw * aht) / (n - a)

		if (asa < 0) {
			asa = null
		}

		//console.log("ASA", asa)

		let acceptable = true
		let message = "Acceptable"

		if (targets.sl && sl < targets.sl) {
			acceptable = false
			message = "SL Target not Met"
		} else if (targets.occ && occ > targets.occ) {
			acceptable = false
			message = "Occupancy Target not Met"
		} else if (targets.asa && asa > targets.asa) {
			acceptable = false
			message = "ASA Target not Met"
		}

		console.log(message)

		console.log("VOL", vol, "AHT", aht, "N", n, "SHRINK", shrink)

		return {
			volumes: vol,
			agents: shrink
				? n / (1 - shrink) / (targets.concurrency ? targets.concurrency : 1)
				: n / (targets.concurrency ? targets.concurrency : 1),
			aht: aht,
			sl: sl,
			asa: asa,
			occupancy: occ,
			acceptable,
			message,
		}
	}
	/**
   *
   * @param {Float} vol (Number of received contacts in inteval)
   * @param {Integer} aht (Average Handling Time in seconds)
   * @param {Float} shrink (0 >= shrink > 1 , Shrinkage applied to requirement)
   * @param {Object} targets ({sl, tt, occ, asa})
   * @returns {Object} {
      volumes: vol,
      agents: n,
      aht: aht,
      sl: sl,
      asa: asa,
      occupancy: occ,
      acceptable,
      message,
    }
   */
	const getLiveRequired = (vol, aht, shrink, targets) => {
		let firstEstimate = Math.round((vol * aht) / interval) + 1

		let required = {}

		if (vol) {
			for (let n = firstEstimate; n < 500; n++) {
				required = calculateErlang(vol, n, aht, targets, shrink) || {}

				if (required.acceptable) {
					break
				} else {
					console.log("For ", n, " -> ", required.message)
				}
			}
		}

		return required
	}

	const getBORequired = (vol, aht, shrink) => {
		if (vol) {
			let agents = shrink
				? (vol * aht) / interval / (1 - shrink)
				: (vol * aht) / interval

			return { agents: agents, volumes: vol, aht: aht }
		} else {
			console.log("No Volumes")
			return {}
		}
	}

	const generateResults = ({ distros, staffing, vol, aht, abs, aux }) => {}

	const generateLiveRequirements = ({
		distros,
		vol,
		aht,
		targets,
		abs,
		off,
		aux,
		absFromTotal,
	}) => {
		let output = distros.map((entry) => {
			let usedAux = entry.auxDist ? entry.auxDist : aux
			let usedAbs = absFromTotal ? abs : 1 - abs * (1 - off)

			let scheduledShrink =
				1 - ((1 - usedAux) * (1 - usedAbs - off)) / (1 - off)

			let totalShrink = 1 - (1 - usedAux) * (1 - usedAbs - off)

			return {
				...entry,
				scheduled: getLiveRequired(
					entry.vDist * vol,
					entry.ahtDist * aht,
					scheduledShrink,
					targets
				),
				total: getLiveRequired(
					entry.vDist * vol,
					entry.ahtDist * aht,
					totalShrink,
					targets
				),
				net: getLiveRequired(
					entry.vDist * vol,
					entry.ahtDist * aht,
					0,
					targets
				),
			}
		})

		return output
	}

	const generateBORequirements = ({
		distros,
		vol,
		aht,
		abs,
		off,
		aux,
		absFromTotal,
	}) => {
		let output = distros.map((entry) => {
			let usedAux = entry.auxDist ? entry.auxDist : aux
			let usedAbs = absFromTotal ? abs : 1 - abs * (1 - off)

			let scheduledShrink =
				1 - ((1 - usedAux) * (1 - usedAbs - off)) / (1 - off)

			let totalShrink = 1 - (1 - usedAux) * (1 - usedAbs - off)

			return {
				...entry,
				scheduled: getBORequired(
					entry.vDist * vol,
					aht * entry.ahtDist,
					scheduledShrink
				),
				total: getBORequired(
					entry.vDist * vol,
					aht * entry.ahtDist,
					totalShrink
				),
			}
		})

		return output
	}

<<<<<<< HEAD
  const boltOnRequirements = (requirementsArr) => {
    if (requirementsArr[0] && requirementsArr[0].length) {
      let boltOn = requirementsArr[0].map((item) => {
        return {
          interval: item.interval,
          weekday: item.weekday,
          scheduled: { agents: item.scheduled.agents || 0 },
          total: { agents: item.total.agents || 0 },
        }
      })

      if (requirementsArr.length > 1) {
        for (let i = 1; i < requirementsArr.length; i++) {
          requirementsArr[i].forEach((item, index) => {
            boltOn[index].scheduled.agents += item.scheduled.agents || 0
            boltOn[index].total.agents += item.total.agents || 0
          })
        }
      }
      return boltOn
    } else {
      console.log("Invalid Requirements Array")
      return -1
    }
  }
=======
	const blendRequirements = (requirementsArr) => {
		if (requirementsArr[0] && requirementsArr[0].length) {
			let blended = requirementsArr[0].map((item) => {
				return {
					interval: item.interval,
					weekday: item.weekday,
					scheduled: { agents: item.scheduled.agents || 0 },
					total: { agents: item.total.agents || 0 },
				}
			})

			if (requirementsArr.length > 1) {
				for (let i = 1; i < requirementsArr.length; i++) {
					requirementsArr[i].forEach((item, index) => {
						blended[index].scheduled.agents += item.scheduled.agents || 0
						blended[index].total.agents += item.total.agents || 0
					})
				}
			}
			return blended
		} else {
			console.log("Invalid Requirements Array")
			return -1
		}
	}
>>>>>>> f4cb336b1847bc57fca76ccdd604d59137227b29

	const getWeeklyValues = (requirements, fteHours) => {
		if (requirements.length === (3600 / interval) * 7 * 24) {
			let totalAccumulator = 0
			let peak = null
			requirements.forEach((slot) => {
				if (slot.total && slot.total.agents) {
					totalAccumulator += slot.total.agents || 0

					if (peak === null && slot.total.agents) {
						peak = slot
					} else if (peak.total && peak.total.agents < slot.total.agents) {
						peak = slot
					}
				}
			})

			return {
				totalReq: (totalAccumulator / fteHours) * (interval / 3600),
				peakReq: peak,
			}
		} else {
			console.log("Invalid Requirements")
			return null
		}
	}

<<<<<<< HEAD
  return {
    updateInterval,
    generateLiveRequirements,
    generateBORequirements,
    boltOnRequirements,
    getWeeklyValues,
  }
=======
	return {
		updateInterval,
		generateLiveRequirements,
		generateBORequirements,
		blendRequirements,
		getWeeklyValues,
	}
>>>>>>> f4cb336b1847bc57fca76ccdd604d59137227b29
}

export default useErlang
