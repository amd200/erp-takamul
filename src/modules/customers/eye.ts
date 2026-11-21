import { EYE_FIELDS, type EyeDto, type Measurement } from "./types"

/** An eye record as the boxes and the invoice print hold it: no value is an empty string. */
export const eyeText = (d: EyeDto): Measurement => Object.fromEntries(EYE_FIELDS.map((k) => [k, d[k] ?? ""])) as Measurement
