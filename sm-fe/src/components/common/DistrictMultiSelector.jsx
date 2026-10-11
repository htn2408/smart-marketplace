import { useState, useEffect } from 'react'
import Icon from './Icon'
import Button from './Button'
import { fetchProvinces, fetchDistricts } from '../../services/addressService'

/**
 * DistrictMultiSelector - Reusable Province & District Picker (without Ward)
 * Used in Tasker Dashboard and Tasker CV Profile to manage WorkerDistricts.
 */
export default function DistrictMultiSelector({
  districts = [],
  onAddDistrict,
  onRemoveDistrict,
  readOnly = false,
}) {
  const [provincesList, setProvincesList] = useState([])
  const [districtsList, setDistrictsList] = useState([])
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('01')
  const [selectedProvinceName, setSelectedProvinceName] = useState('Thành phố Hà Nội')
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('')

  useEffect(() => {
    if (readOnly) return
    let isMounted = true
    async function initLocations() {
      const provs = await fetchProvinces()
      if (isMounted && provs.length > 0) {
        setProvincesList(provs)
      }
      const dists = await fetchDistricts('01')
      if (isMounted && dists.length > 0) {
        setDistrictsList(dists)
      }
    }
    initLocations()
    return () => {
      isMounted = false
    }
  }, [readOnly])

  const handleProvinceChange = async (e) => {
    const code = e.target.value
    setSelectedProvinceCode(code)
    setSelectedDistrictCode('')
    const found = provincesList.find((p) => p.id === code)
    setSelectedProvinceName(found ? found.full_name : '')
    if (code) {
      const dists = await fetchDistricts(code)
      setDistrictsList(dists)
    } else {
      setDistrictsList([])
    }
  }

  const handleAdd = () => {
    if (!selectedDistrictCode) return
    const distObj = districtsList.find((d) => d.id === selectedDistrictCode)
    if (!distObj) return

    const exists = districts.some((d) => d.districtCode === distObj.id)
    if (exists) {
      setSelectedDistrictCode('')
      return
    }

    onAddDistrict?.({
      provinceCode: selectedProvinceCode,
      provinceName: selectedProvinceName,
      districtCode: distObj.id,
      districtName: distObj.full_name,
    })
    setSelectedDistrictCode('')
  }

  return (
    <div className="space-y-4">
      {/* Active District Pill Chips */}
      {districts && districts.length > 0 ? (
        <div className="flex flex-wrap gap-2.5">
          {districts.map((item, idx) => {
            const label =
              item.districtName && item.provinceName
                ? `${item.districtName} — ${item.provinceName}`
                : item.districtName || item.name
            return (
              <div
                key={item.id || item.districtCode || idx}
                className="inline-flex items-center gap-2 bg-primary-fixed/40 text-primary border border-primary/25 px-3.5 py-2 rounded-xl text-xs font-bold"
              >
                <Icon name="near_me" size={15} />
                <span>{label}</span>
                {!readOnly && onRemoveDistrict && (
                  <button
                    type="button"
                    onClick={() => onRemoveDistrict(item.districtCode)}
                    className="ml-1 text-primary/70 hover:text-red-600 cursor-pointer"
                    title="Xoá khu vực này"
                  >
                    <Icon name="close" size={15} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-5 rounded-xl bg-surface-container-low/60 border border-dashed border-outline-variant/60 flex items-center gap-3 text-on-surface-variant">
          <Icon name="location_off" size={22} className="text-primary shrink-0" />
          <p className="font-body-sm text-sm italic">
            Khu vực hoạt động hiện đang trống. Hãy chọn Thành phố và Quận/Huyện bên dưới để bổ sung phạm vi nhận việc của bạn.
          </p>
        </div>
      )}

      {/* Province & District Picker (No Ward) */}
      {!readOnly && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-surface-variant/30 items-end">
          <div className="sm:col-span-5">
            <label className="block font-label-sm text-xs font-bold text-on-surface mb-1">
              Tỉnh / Thành phố
            </label>
            <select
              value={selectedProvinceCode}
              onChange={handleProvinceChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              {provincesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5">
            <label className="block font-label-sm text-xs font-bold text-on-surface mb-1">
              Quận / Huyện muốn thêm
            </label>
            <select
              value={selectedDistrictCode}
              onChange={(e) => setSelectedDistrictCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">-- Chọn Quận / Huyện --</option>
              {districtsList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <Button
              variant="primary"
              size="sm"
              icon="add"
              onClick={handleAdd}
              disabled={!selectedDistrictCode}
              className="w-full rounded-xl justify-center py-2.5 text-xs font-bold"
            >
              Thêm Quận
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
