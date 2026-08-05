import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteAddress, setDefaultAddress } from "@/actions/auth";
import { AddressForm } from "@/components/account/address-form";

export default async function AccountAddressesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) return null;

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-12">
      {addresses.length ? (
        <ul className="grid gap-5 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="flex flex-col border border-line p-5">
              {address.isDefault ? (
                <span className="mb-3 w-fit cut text-[0.5625rem] tracking-[0.18em] uppercase">
                  {dict.account.defaultAddress}
                </span>
              ) : null}

              <p className="font-medium">{address.fullName}</p>
              <p className="mt-1 text-sm text-content-muted nums">
                {address.phone}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-content-muted">
                {address.province}، {address.city}، {address.line1}
              </p>
              <p className="mt-1 text-xs text-content-faint nums">
                {address.postalCode}
              </p>

              <div className="mt-auto flex items-center gap-4 pt-5">
                {!address.isDefault ? (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <button
                      type="submit"
                      className="text-xs text-content-muted transition-colors hover:text-accent"
                    >
                      {dict.account.setDefault}
                    </button>
                  </form>
                ) : null}
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={address.id} />
                  <button
                    type="submit"
                    className="text-xs text-content-faint transition-colors hover:text-rust-400"
                  >
                    {dict.common.delete}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border border-line px-6 py-12 text-content-muted">
          {dict.account.noAddresses}
        </p>
      )}

      <section>
        <h2 className="mb-6 text-title font-medium">{dict.account.addAddress}</h2>
        <AddressForm locale={locale} dict={dict} />
      </section>
    </div>
  );
}
