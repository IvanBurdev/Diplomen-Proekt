CREATE OR REPLACE FUNCTION public.decrement_product_stock_on_order_item_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock INTEGER;
  current_size_stock JSONB;
  requested_size TEXT;
  requested_size_stock INTEGER;
BEGIN
  requested_size := COALESCE(NEW.size, '');

  SELECT stock, COALESCE(size_stock, '{}'::jsonb)
  INTO current_stock, current_size_stock
  FROM products
  WHERE id = NEW.product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Продуктът не е намерен.';
  END IF;

  IF requested_size <> '' AND current_size_stock ? requested_size THEN
    requested_size_stock := COALESCE((current_size_stock ->> requested_size)::INTEGER, 0);

    IF requested_size_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Недостатъчна наличност за размер %.', requested_size;
    END IF;

    current_size_stock := jsonb_set(
      current_size_stock,
      ARRAY[requested_size],
      to_jsonb(requested_size_stock - NEW.quantity),
      true
    );

    UPDATE products
    SET
      size_stock = current_size_stock,
      stock = GREATEST(0, stock - NEW.quantity),
      updated_at = NOW()
    WHERE id = NEW.product_id;
  ELSE
    IF current_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Недостатъчна наличност.';
    END IF;

    UPDATE products
    SET
      stock = stock - NEW.quantity,
      updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_product_stock_on_order_item_insert ON public.order_items;

CREATE TRIGGER trg_decrement_product_stock_on_order_item_insert
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.decrement_product_stock_on_order_item_insert();
