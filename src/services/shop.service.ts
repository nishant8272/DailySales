import { Shop } from "../models/shop.model";
import { HttpError } from "../utils/http-error";

type CreateShopInput = {
  name: string;
  owner_name: string;
  phone: string;
  address?: string;
  timezone?: string;
};

type UpdateShopInput = Partial<CreateShopInput>;

export const createShop = async (payload: CreateShopInput) => {
  return Shop.create(payload);
};

export const listActiveShops = async () => {
  return Shop.find({ is_active: true }).sort({ created_at: -1 });
};

export const getShopById = async (id: string) => {
  const shop = await Shop.findById(id);

  if (!shop) {
    throw new HttpError(404, "Shop not found");
  }

  return shop;
};

export const updateShopById = async (id: string, payload: UpdateShopInput) => {
  const shop = await Shop.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!shop) {
    throw new HttpError(404, "Shop not found");
  }

  return shop;
};

export const updateMyShop = async (
  shop_id: string,
  payload: { name?: string; address?: string }
) => {
  const updatePayload: { name?: string; address?: string } = {};

  if (payload.name !== undefined) {
    updatePayload.name = payload.name.trim();
  }

  if (payload.address !== undefined) {
    updatePayload.address = payload.address.trim();
  }

  const shop = await Shop.findByIdAndUpdate(shop_id, updatePayload, {
    new: true,
    runValidators: true,
  });

  if (!shop) {
    throw new HttpError(404, "Shop not found");
  }

  return shop;
};

export const deactivateShopById = async (id: string) => {
  const shop = await Shop.findByIdAndUpdate(
    id,
    { is_active: false },
    { new: true, runValidators: true }
  );

  if (!shop) {
    throw new HttpError(404, "Shop not found");
  }

  return shop;
};
