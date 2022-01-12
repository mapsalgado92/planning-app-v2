import { useState } from "react"

const useErlang = ({ interval }) => {
  const [interval, setInterval] = useState(interval || 900)

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
  const calculateErlang = (vol, n, aht, targets) => {
    const powOverFact = (pow, exp, fact) => {
      let prod = 1
      let nExp = exp
      let nFact = fact
      while (nExp > 0 || nFact > 1) {
        if (nExp === 0) {
          prod *= 1 / nFact
        } else {
          prod *= pow / nFact
        }
        nExp--
        nFact--
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
      return null
    }

    let a = (vol * aht) / interval

    let x = powOverFact(a, n, n) * (n / (n - a))

    console.log("X", x)

    let y = 0

    for (let i = 0; i < n; i++) {
      y += powOverFact(a, i, i)
    }

    console.log("Y", y)

    let pw = x / (y + x)

    console.log("PW", pw)

    let sl = 1 - pw * Math.exp((-(n - a) * targets.tt) / aht)

    if (sl < 0) {
      sl = 0
    }

    console.log("SL", sl)

    let occ = a / n

    if (occ > 1) {
      occ = 1
    }

    console.log("Occ", occ)

    let asa = (pw * aht) / (n - a)

    if (asa < 0) {
      asa = null
    }

    console.log("ASA", asa)

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

    return {
      volumes: vol,
      agents: n,
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
  const getRequired = (vol, aht, shrink, targets) => {
    if (!vol) {
      return null
    }

    let firstEstimate = Math.round((vol * aht) / interval) + 1

    let required = {}

    for (let n = firstEstimate; n < 1000; n++) {
      required = calculateErlang(vol, n, aht, targets)
      if (required.acceptable) {
        return shrink ? required / (1 - shrink) : required
      } else {
        console.log("For ", n, " -> ", required.message)
      }
    }
  }

  const generateResults = (distros, staffing, vol, aht) => {}

  const generateRequirements = (distros, vol, aht, targets) => {}

  return {
    updateInterval,
    calculateErlang,
    getRequired,
  }
}

export default useErlang