import EditEntry from "@/components/layouts/EditEntry";

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditEntry entryId={id} />;
}
