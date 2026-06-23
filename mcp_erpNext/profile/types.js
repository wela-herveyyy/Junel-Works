export const EMPTY_PROFILE = {
    fullName: "",
    position: "",
    workEmail: "",
    company: "",
    department: "",
    erpnextUser: "",
    employeeId: "",
    employeeName: "",
    timezone: "",
    dateFormat: "YYYY-MM-DD",
    notes: "",
    _meta: {
        updatedAt: "",
    },
};
export const PROFILE_FIELDS = [
    "fullName",
    "position",
    "workEmail",
    "company",
    "department",
    "erpnextUser",
    "employeeId",
    "employeeName",
    "timezone",
    "dateFormat",
    "notes",
];
const FIELD_ALIASES = {
    full_name: "fullName",
    fullname: "fullName",
    name: "fullName",
    position: "position",
    designation: "position",
    title: "position",
    work_email: "workEmail",
    email: "workEmail",
    company: "company",
    department: "department",
    erpnext_user: "erpnextUser",
    user: "erpnextUser",
    employee_id: "employeeId",
    employee: "employeeId",
    employee_name: "employeeName",
    timezone: "timezone",
    date_format: "dateFormat",
    notes: "notes",
};
export function normalizeProfileUpdates(input) {
    const updates = {};
    for (const [key, value] of Object.entries(input)) {
        if (key === "_meta" || typeof value !== "string") {
            continue;
        }
        const field = FIELD_ALIASES[key] ?? (PROFILE_FIELDS.includes(key) ? key : null);
        if (field) {
            updates[field] = value;
        }
    }
    return updates;
}
export function mergeProfile(base, updates) {
    const merged = { ...base, ...updates };
    merged._meta = {
        ...base._meta,
        ...updates._meta,
        updatedAt: new Date().toISOString(),
    };
    return merged;
}
