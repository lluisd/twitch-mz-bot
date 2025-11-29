const { z } = require("zod");

// Valores permitidos para match (string, number, boolean)
const ValueVariants = z.union([z.string(), z.number(), z.boolean()]);

// Match exacto
const MatchValue = z.object({
    value: ValueVariants,
});

// Rango numérico
const NumericRange = z.object({
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
});

const isoDateString = z.string().refine(val => {
    try {
        new Date(val); // construye fecha, lanza error si inválida
        return val.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(val);
    } catch {
        return false;
    }
}, { message: "Fecha ISO con zona horaria requerida" });

const DateRange = z.object({
    lt: isoDateString.optional(),
    lte: isoDateString.optional(),
    gt: isoDateString.optional(),
    gte: isoDateString.optional(),
});

// Un rango es numérico o de fecha, pero no ambos simultáneamente
const RangeInterface = z.union([NumericRange, DateRange]);

// Condición sobre un campo
const FieldCondition = z.object({
    key: z.string(),

    match: MatchValue.optional(),

    // Solo puede haber range o match, no ambos a la vez
    range: RangeInterface.optional(),
}).refine(data => !(data.match && data.range), {
    message: "Cannot have both 'match' and 'range' in the same condition",
});

// Condición nested para filtros anidados
const NestedCondition = z.object({
    nested: z.object({
        key: z.string(),
        filter: z.lazy(() => FilterSchema),
    }),
});

// Una condición puede ser un FieldCondition o NestedCondition
const Condition = z.union([FieldCondition, NestedCondition]);

// Filtro principal
const FilterSchema = z.object({
    must: z.array(Condition).optional(),
    should: z.array(Condition).optional(),
    must_not: z.array(Condition).optional(),
});

module.exports = {
    FilterSchema,
    Condition,
    FieldCondition,
};
