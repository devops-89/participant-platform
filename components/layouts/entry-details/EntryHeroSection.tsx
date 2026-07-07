import { EmojiEvents, HowToVote, Info, Group, Person } from '@mui/icons-material';
import { Box, Card, Chip, Typography, Tooltip } from '@mui/material';
import Image from 'next/image';

interface EntryHeroSectionProps {
  entry: {
    submission?: { data?: Record<string, string> };
    contest?: {
      entryLevelTemplate?: { schema?: { fields?: { label?: string; id?: string }[] } };
      entry_level_template?: { schema?: { fields?: { label?: string; id?: string }[] } };
      userLevelTemplate?: { schema?: { fields?: { label?: string; id?: string }[] } };
      user_level_template?: { schema?: { fields?: { label?: string; id?: string }[] } };
    };
    participant?: {
      submission?: { data?: Record<string, string> | { data?: Record<string, string> } };
      participant_profile_data?: Record<string, string>;
      data?: Record<string, string>;
    };
    id?: string;
    created_at?: string;
    status?: string;
    rejectReason?: string;
    [key: string]: unknown;
  };
  colors: Record<string, string>;
  showStatus?: boolean;
}

export default function EntryHeroSection({ entry, colors, showStatus = false }: EntryHeroSectionProps) {
  // Maps an entry's raw status to what should be shown in the status chip.
  // "approved" is intentionally displayed as "Moderate" per product requirement.
  const getStatusChipProps = (rawStatus: string) => {
    const status = (rawStatus || "").toLowerCase();
    const map: Record<string, { label: string; bg: string; color: string }> = {
      approved: { label: "Moderate", bg: "rgba(245, 158, 11, 0.12)", color: "#b45309" },
      pending: { label: "Pending", bg: "rgba(100, 116, 139, 0.12)", color: "#475569" },
      evaluated: { label: "Evaluated", bg: "rgba(16, 185, 129, 0.12)", color: "#059669" },
      rejected: { label: "Rejected", bg: "rgba(220, 38, 38, 0.12)", color: "#dc2626" },
      banned: { label: "Banned", bg: "rgba(220, 38, 38, 0.12)", color: "#dc2626" },
      semifinal: { label: "Semifinal", bg: "rgba(99, 102, 241, 0.12)", color: "#4f46e5" },
      final: { label: "Final", bg: "rgba(99, 102, 241, 0.12)", color: "#4f46e5" },
      winner: { label: "Winner", bg: "rgba(245, 158, 11, 0.12)", color: "#b45309" },
      draft: { label: "Draft", bg: "rgba(100, 116, 139, 0.12)", color: "#475569" },
    };
    return (
      map[status] || {
        label: rawStatus ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1) : "Unknown",
        bg: "rgba(100, 116, 139, 0.12)",
        color: "#475569",
      }
    );
  };

  return (
    <Card
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: { xs: "column", md: "row" },
        borderRadius: 4,
        border: `1px solid ${colors.BORDER}`,
        background: `linear-gradient(135deg, ${colors.SURFACE} 0%, rgba(99, 102, 241, 0.02) 100%)`,
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.03)",
        mb: 5,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", md: "35%" },
          minHeight: { xs: 300, md: "auto" },
          position: "relative",
          bgcolor: "rgba(0,0,0,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {(() => {
          const submissionData = entry?.submission?.data || {};
          const entryFields = entry?.contest?.entryLevelTemplate?.schema?.fields || entry?.contest?.entry_level_template?.schema?.fields || [];
          const thumbnailField = entryFields?.find((f: { label?: string; id?: string }) => (f.label?.toLowerCase() || '').includes("thumbnail"));
          let thumbnailUrl = "";
          if (thumbnailField) {
            thumbnailUrl = submissionData[`${thumbnailField.id || ''}_downloadUrl`] || submissionData[`${thumbnailField.label || ''}_downloadUrl`] || submissionData[thumbnailField.id || ''] || submissionData[thumbnailField.label || ''] || "";
          }
          if (!thumbnailUrl) {
            const downloadUrlKey = Object.keys(submissionData).find((key) => key.endsWith("_downloadUrl"));
            thumbnailUrl = downloadUrlKey ? submissionData[downloadUrlKey] : "";
          }
          if (!thumbnailUrl) {
            const imageUrlKey = Object.keys(submissionData).find((key) => {
              if (key === "status" || key.endsWith("_downloadUrl")) return false;
              const val = submissionData[key];
              return typeof val === "string" && /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(val.split('?')[0]);
            });
            if (imageUrlKey) thumbnailUrl = submissionData[imageUrlKey];
          }
          
          if (thumbnailUrl) {
            return <Image src={thumbnailUrl} alt="Thumbnail" fill style={{ objectFit: "cover" }} unoptimized />;
          }
          return <EmojiEvents sx={{ fontSize: 80, color: "rgba(0,0,0,0.2)" }} />;
        })()}
      </Box>

      <Box sx={{ width: { xs: "100%", md: "65%" }, p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, alignItems: 'flex-start' }}>
            {(() => {
              const sData = entry?.submission?.data || {};
              const entryFields = entry?.contest?.entryLevelTemplate?.schema?.fields || entry?.contest?.entry_level_template?.schema?.fields || [];
              const entryTitleField = entryFields?.find((f: { label?: string; id?: string }) => {
                const l = f.label?.toLowerCase() || "";
                return l.includes("title") || l.includes("project");
              });

              let entryTitle = "";
              if (entryTitleField && sData) {
                entryTitle = sData[entryTitleField.label || ''] || sData[entryTitleField.id || ''];
              }
              if (!entryTitle) {
                entryTitle = sData?.name_1 || sData?.ho1p00z0q || sData?.["Innovation Title"] || sData?.zvdskzwrw;
              }
              if (!entryTitle) {
                const values = Object.entries(sData)
                  .filter(([k, v]: [string, unknown]) => !["status", "isdraft"].includes(k.toLowerCase()) && typeof v === 'string' && v.trim() !== '' && isNaN(Number(v)) && !v.includes('http') && v.length < 60 && !/^[0-9+\-\s()]+$/.test(v))
                  .map(([, v]) => v);
                if (values.length > 0) entryTitle = values[0] as string;
              }

              let category = "";
              const categoryField = entryFields?.find((f: { label?: string; id?: string }) => (f.label?.toLowerCase() || '').includes("category"));
              if (categoryField && sData) {
                category = sData[categoryField.label || ''] || sData[categoryField.id || ''];
              }

              const displayTitle = entryTitle || "Untitled Entry";
              
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      color: colors.TEXT_PRIMARY,
                      fontSize: { xs: "1.75rem", md: "2.25rem" },
                    }}
                  >
                    {displayTitle}
                  </Typography>
                  {category && (
                    <Typography variant="body1" sx={{ color: colors.TEXT_SECONDARY, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      Innovation Category: <span style={{ color: colors.PRIMARY }}>{category}</span>
                    </Typography>
                  )}
                </Box>
              );
            })()}

            {entry.score !== undefined && entry.score !== null && (
              <Chip
                icon={
                  <EmojiEvents
                    sx={{ fontSize: "16px !important", color: "#fff !important" }}
                  />
                }
                label={`Score: ${entry.score}`}
                sx={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.2)",
                  border: "none",
                  "& .MuiChip-label": { px: 1.5 },
                }}
              />
            )}
          </Box>

          <Box sx={{ textAlign: { xs: "left", md: "right" }, minWidth: 150 }}>
            {showStatus ? (
              (() => {
                const { label, bg, color } = getStatusChipProps(entry.status || '');
                return (
                  <Chip
                    label={label}
                    sx={{
                      bgcolor: bg,
                      color: color,
                      fontWeight: 700,
                      border: "none",
                      "& .MuiChip-label": { px: 1.5 },
                    }}
                  />
                );
              })()
            ) : (
              ["semifinal", "final", "winner"].includes(entry.status?.toLowerCase() || '') && (
                <>
                  <Typography variant="caption" sx={{ color: colors.TEXT_SECONDARY, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5, display: "block" }}>
                    Total Public Vote
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: colors.PRIMARY, mt: 0.5, display: "flex", alignItems: "center", justifyContent: { xs: "flex-start", md: "flex-end" }, gap: 1 }}>
                    <HowToVote fontSize="small" />
                    {String(entry.voteCount || 0)}
                  </Typography>
                </>
              )
            )}
          </Box>
        </Box>

        <Typography
          variant="body1"
          sx={{
            color: colors.TEXT_SECONDARY,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 3
          }}
        >
          <span>Submitted by:</span>
          <Box component="span" sx={{ color: colors.TEXT_PRIMARY, fontWeight: 700 }}>
            {(() => {
              const rawAuthorData = entry?.participant?.submission?.data;
              const authorData = rawAuthorData?.data || rawAuthorData || ((entry?.participant as Record<string, unknown>)?.data as Record<string, unknown> | undefined) || ((entry?.participant as Record<string, unknown>)?.participant_profile_data as Record<string, unknown> | undefined) || {};
              const userFields = entry?.contest?.userLevelTemplate?.schema?.fields || entry?.contest?.user_level_template?.schema?.fields || [];
              
              const firstNameField = userFields.find((f: { label?: string; id?: string }) => {
                const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
                return l.includes("firstname") || l === "first";
              });
              const lastNameField = userFields.find((f: { label?: string; id?: string }) => {
                const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
                return l.includes("lastname") || l === "last";
              });
              const fullNameField = userFields.find((f: { label?: string; id?: string }) => {
                const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
                return l.includes("fullname") || l === "name" || (l.includes("name") && !l.includes("first") && !l.includes("last"));
              });

              let participantName = "";

              if (firstNameField || lastNameField) {
                const first = firstNameField ? ((authorData as Record<string, unknown>)[firstNameField.label || ''] || (authorData as Record<string, unknown>)[firstNameField.id || '']) : "";
                const last = lastNameField ? ((authorData as Record<string, unknown>)[lastNameField.label || ''] || (authorData as Record<string, unknown>)[lastNameField.id || '']) : "";
                participantName = `${first || ""} ${last || ""}`.trim();
              }
              
              if (!participantName && fullNameField) {
                participantName = ((authorData as Record<string, unknown>)[fullNameField.label || ''] as string) || ((authorData as Record<string, unknown>)[fullNameField.id || ''] as string);
              }

              if (!participantName && authorData && Object.keys(authorData).length > 0) {
                const fallback = userFields.find((f: { label?: string; id?: string }) => (f.label?.toLowerCase() || '').includes("name"));
                if (fallback && ((authorData as Record<string, unknown>)[fallback.label || ''] || (authorData as Record<string, unknown>)[fallback.id || ''])) {
                  participantName = ((authorData as Record<string, unknown>)[fallback.label || ''] as string) || ((authorData as Record<string, unknown>)[fallback.id || ''] as string);
                } else {
                  participantName = ((authorData as Record<string, unknown>)?.yg9snrxlh as string) || ((authorData as Record<string, unknown>)?.an7ffo0mu as string) || ((authorData as Record<string, unknown>)?.qlon5xekd as string);
                }
              }

              if (!participantName && entry?.submission?.data) {
                const sData = entry.submission.data;
                const entryFields = entry?.contest?.entryLevelTemplate?.schema?.fields || entry?.contest?.entry_level_template?.schema?.fields || [];
                const allFields = [...userFields, ...entryFields];
                const fNameField = allFields.find((f: { label?: string; id?: string }) => {
                  const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
                  return l.includes("firstname") || l === "first";
                });
                const lNameField = allFields.find((f: { label?: string; id?: string }) => {
                  const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
                  return l.includes("lastname") || l === "last";
                });
                
                if (fNameField || lNameField) {
                  const first = fNameField ? (sData[fNameField.label || ''] || sData[fNameField.id || '']) : "";
                  const last = lNameField ? (sData[lNameField.label || ''] || sData[lNameField.id || '']) : "";
                  participantName = `${first || ""} ${last || ""}`.trim();
                }
                
                if (!participantName) {
                   participantName = sData.yg9snrxlh || sData.an7ffo0mu || sData.qlon5xekd || sData.os28hf1aa;
                   if (participantName && sData.tlb9rveot) participantName += " " + sData.tlb9rveot;
                }
              }

              if (!participantName && authorData && Object.keys(authorData).length > 0) {
                 const values = Object.values(authorData as Record<string, unknown>).filter((v: unknown) => typeof v === 'string' && v.trim() !== '' && isNaN(Number(v)) && !v.includes('http') && v.length < 60 && !/^[0-9+\-\s()]+$/.test(v));
                 if (values.length > 0) participantName = values[0] as string;
              }
              
              return participantName || "Unknown Participant";
            })()}
          </Box>
          {(() => {
            const sData = entry?.submission?.data || {};
            const entryFields = entry?.contest?.entryLevelTemplate?.schema?.fields || entry?.contest?.entry_level_template?.schema?.fields || [];
            const participationTypeField = entryFields.find((f: { label?: string; id?: string }) => {
                const l = f.label?.toLowerCase() || "";
                return l.includes("participation type") || l.includes("team or individual");
            });
            let type = "";
            if (participationTypeField) {
                type = sData[participationTypeField.label || ''] || sData[participationTypeField.id || ''] || "";
            }
            if (!type) {
              type = sData.d9ngw1qqv || "";
            }
            
            if (!type) return null;

            const isTeam = type.toLowerCase()?.includes("team");

            return (
              <Tooltip title={`Participation Type: ${type}`} arrow placement="top">
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', ml: 1, pl: 1, borderLeft: `2px solid ${colors.BORDER}` }}>
                  {isTeam ? <Group fontSize="small" color="primary" /> : <Person fontSize="small" color="primary" />}
                </Box>
              </Tooltip>
            );
          })()}
        </Typography>

        <Box sx={{ display: 'flex', gap: 4, flexWrap: "wrap", mt: 'auto' }}>
          <Box>
            <Typography variant="caption" sx={{ color: colors.TEXT_SECONDARY, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5, mb: 0.5, display: "block" }}>
              Submission ID
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.TEXT_PRIMARY }}>
              {entry.id}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: colors.TEXT_SECONDARY, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5, mb: 0.5, display: "block" }}>
              Submitted At
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.TEXT_PRIMARY }}>
              {entry.created_at ? new Date(entry.created_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              }) : "N/A"}
            </Typography>
          </Box>
        </Box>

        {entry.status?.toLowerCase() === "rejected" && entry.rejectReason && (
          <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: "rgba(220, 38, 38, 0.05)", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
            <Typography variant="subtitle2" sx={{ color: "#dc2626", fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info fontSize="small" /> Reason for Rejection
            </Typography>
            <Typography variant="body2" sx={{ color: colors.TEXT_PRIMARY, pl: 3 }}>{String(entry.rejectReason)}</Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}
