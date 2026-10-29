import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { deleteRestaurant, setStatus, updateRestaurant } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ImageField } from "@/components/admin/ImageField";
import { RestaurantTabs } from "@/components/admin/RestaurantTabs";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Card, Field, Flash, dangerButtonClass, inputClass, quietButtonClass } from "@/components/admin/ui";
import { QrCode } from "@/components/hero/QrCode";
import { business } from "@/config/business";
import { requireAdmin } from "@/lib/menuflex/admin";
import { siteOrigin } from "@/lib/menuflex/site";
import { CURRENCIES, type RestaurantRow } from "@/lib/menuflex/types";
import { imageUrl } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Restaurant" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

export default async function RestaurantSettingsPage({ params, searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const { ok, error } = await searchParams;
  const { data: r } = await supabase.from("restaurants").select("*").eq("id", id).maybeSingle<RestaurantRow>();
  if (!r) notFound();

  const origin = await siteOrigin();
  const qrUrl = `${origin}/r/${r.public_code}/`;
  const [qrPng, qrSvg] = await Promise.all([
    QRCode.toDataURL(qrUrl, { width: 1200, margin: 2, errorCorrectionLevel: "M" }),
    QRCode.toString(qrUrl, { type: "svg", margin: 2, errorCorrectionLevel: "M" }),
  ]);
  const update = updateRestaurant.bind(null, r.id);

  return (
    <>
      <RestaurantTabs restaurant={r} current="settings" />
      <Flash ok={ok} error={error} />

      <Card title="Status">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-[14px] leading-relaxed text-cream-soft">
            {r.status === "published"
              ? "Published: the menu is live and the restaurant appears in Our Work."
              : "Draft: only admins can see this menu. Publish it to put it live, list it in Our Work and get its QR code."}
          </p>
          <form action={setStatus.bind(null, r.id, r.status === "published" ? "draft" : "published")}>
            {r.status === "published" ? (
              <ConfirmButton message="Take this menu offline? Its QR code will lead to the MenuFlex home page until it's published again." className={quietButtonClass}>
                Unpublish
              </ConfirmButton>
            ) : (
              <SubmitButton pendingLabel="Publishing…">Publish</SubmitButton>
            )}
          </form>
        </div>
      </Card>

      {r.status === "published" && (
        <Card title="QR code">
          <div className="flex flex-wrap items-center gap-6">
            <QrCode url={qrUrl} label={`QR code for ${r.name}`} className="h-40 w-40 p-1" />
            <div className="min-w-0 flex-1 space-y-3 text-[14px] text-cream-soft">
              <p>
                This address never changes, even if the web address below is edited, so printed codes keep working:
                <br />
                <a href={qrUrl} target="_blank" rel="noreferrer" className="break-all text-gold-bright underline-offset-4 hover:underline">
                  {qrUrl}
                </a>
              </p>
              {!business.siteUrl && (
                <p className="text-[13px] text-cream-muted">Set NEXT_PUBLIC_SITE_URL so the code always uses the public domain, not this address.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <a href={qrPng} download={`${r.slug}-qr.png`} className={quietButtonClass}>
                  Download PNG
                </a>
                <a href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`} download={`${r.slug}-qr.svg`} className={quietButtonClass}>
                  Download SVG
                </a>
              </div>
            </div>
          </div>
        </Card>
      )}

      <form action={update} className="space-y-6">
        <Card title="Restaurant">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input name="name" required maxLength={80} defaultValue={r.name} className={inputClass} />
            </Field>
            <Field label="Web address" hint={`The menu lives at /m/${r.slug}/`}>
              <input name="slug" required maxLength={60} pattern="[a-z0-9\-]+" defaultValue={r.slug} className={inputClass} />
            </Field>
            <Field label="Subtitle (English)" hint="Shown under the name, e.g. Kitchen & Bar">
              <input name="subtitle_en" maxLength={80} defaultValue={r.subtitle_en} className={inputClass} />
            </Field>
            <Field label="Subtitle (Turkish)">
              <input name="subtitle_tr" maxLength={80} defaultValue={r.subtitle_tr} className={inputClass} />
            </Field>
            <Field label="Currency">
              <select name="currency" defaultValue={r.currency} className={inputClass}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Menu opens in">
              <select name="default_locale" defaultValue={r.default_locale} className={inputClass}>
                <option value="tr">Turkish</option>
                <option value="en">English</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card title="Logo and colours">
          <div className="space-y-5">
            <Field label="Logo" hint="Shown small above the name. A transparent PNG works best.">
              <ImageField name="logo" current={r.logo_path ? imageUrl(r.logo_path) : null} removable />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Accent colour" hint="The name and the selected category. MenuFlex gold by default.">
                <input type="color" name="accent_color" defaultValue={r.accent_color} className="h-10 w-20 cursor-pointer rounded-lg border border-cream/15 bg-night-950 p-1" />
              </Field>
              <Field label="Background colour" hint="MenuFlex dark by default.">
                <input type="color" name="background_color" defaultValue={r.background_color} className="h-10 w-20 cursor-pointer rounded-lg border border-cream/15 bg-night-950 p-1" />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Contact details">
          <p className="-mt-2 mb-4 text-[13px] text-cream-muted">Optional. Filled ones are shown at the foot of the full-menu list.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <input name="phone" maxLength={40} defaultValue={r.phone} placeholder="+90 212 000 00 00" className={inputClass} />
            </Field>
            <Field label="WhatsApp" hint="International format, digits only, e.g. 905xxxxxxxxx">
              <input name="whatsapp" maxLength={20} inputMode="numeric" defaultValue={r.whatsapp} className={inputClass} />
            </Field>
            <Field label="Email">
              <input type="email" name="email" maxLength={120} defaultValue={r.email} className={inputClass} />
            </Field>
            <Field label="Instagram" hint="Username, without @">
              <input name="instagram" maxLength={60} defaultValue={r.instagram} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <input name="address" maxLength={200} defaultValue={r.address} className={inputClass} />
              </Field>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <SubmitButton>Save changes</SubmitButton>
        </div>
      </form>

      <Card title="Delete restaurant">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-[14px] text-cream-soft">Removes the restaurant, its whole menu and its images. This can&rsquo;t be undone.</p>
          <form action={deleteRestaurant.bind(null, r.id)}>
            <ConfirmButton message={`Delete ${r.name} and its whole menu? This can't be undone.`} className={dangerButtonClass}>
              Delete restaurant
            </ConfirmButton>
          </form>
        </div>
      </Card>
    </>
  );
}
