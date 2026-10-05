/**
 * These are not a copy of the database's enums — `supabase gen types` emits a
 * runtime `Constants` object alongside the types, so they are the database's
 * enums, imported. A JSON Schema for a model and a Zod enum both need a real
 * array, and this is one. Adding a value in a migration and running
 * `./scripts/gen_supabase_types.sh` is the entire update.
 *
 * Values stay in English because that is what the app's Dart enums parse; the
 * Chinese a shopper sees is applied at display time in
 * `product_attributes_extensions.dart` and belongs only there.
 */
import { Constants } from "./database.types.ts";

const ENUMS = Constants.public.Enums;

export const ELASTICITY_VALUES = ENUMS.product_elasticity;
export const THICKNESS_VALUES = ENUMS.product_thickness;
export const FIT_VALUES = ENUMS.product_fit;
export const SEASON_VALUES = ENUMS.product_season;
export const CHANNEL_VALUES = ENUMS.store_channel;
export const GENDER_VALUES = ENUMS.product_gender;
export const GARMENT_TYPE_VALUES = ENUMS.garment_type;

/**
 * The exception. `products.styles` is `text[]` with no enum behind it, because
 * `ClothingStyle` is a vocabulary of subjective tags and the one most likely
 * to churn — the shape an enum handles worst. Nothing generates this list, so
 * it must be kept in step with
 * `lib/feature/common/clothing_style/domain/entities/clothing_style.dart` by hand.
 */
export const STYLE_VALUES = [
  "japanese", "korean", "western", "british", "chinese",
  "minimalist", "casual", "sporty", "lazy", "streetwear",
  "business", "preppy", "functional", "vintage", "artsy",
  "literary", "elegant", "mature", "neutral", "spicy", "sweet",
] as const;
