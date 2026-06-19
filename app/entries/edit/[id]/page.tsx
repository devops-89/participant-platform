import EditEntry from "@/components/layouts/EditEntry";

export default function EditEntryPage({ params }: { params: { id: string } }) {
  return <EditEntry entryId={params.id} />;
}
