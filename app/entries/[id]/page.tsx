import EntryDetails from "@/components/layouts/EntryDetails";

export default async function ViewEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <EntryDetails entryId={id} />;
}
