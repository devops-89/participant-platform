import re

with open("components/layouts/EntryDetails.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace imports and VideoPlayerRenderer
new_imports = r"""  PlayArrow,
  Videocam,
  Image as ImageIcon
} from "@mui/icons-material";
import { Avatar, Box, Button, Card, Chip, CircularProgress, Grid, Paper, Rating, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState, useRef } from "react";

import EntryDetailsSection from "@/components/layouts/entry-details/EntryDetailsSection";
import EntryHeroSection from "@/components/layouts/entry-details/EntryHeroSection";
import InnovationVideoPlayer, { VideoPlayerRenderer } from "@/components/layouts/entry-details/InnovationVideoPlayer";
import TeamMembersSection from "@/components/layouts/entry-details/TeamMembersSection";

const EntryDetails = ({ entryId }: { entryId: string }) => {"""

pattern1 = re.compile(r'  PlayArrow,\n  Videocam,\n  Image as ImageIcon\n\} from "@mui/icons-material";\nimport \{ Avatar.*?const EntryDetails = \(\{ entryId \}: \{ entryId: string \}\) => \{', re.DOTALL)
content = pattern1.sub(new_imports.replace('\\', '\\\\'), content)
# Wait, replacing using raw string might not be fully safe in sub if there are backslashes, so let's just use simple replace for the sub replacement or use a function.
def repl_func1(match):
    return new_imports

content = pattern1.sub(repl_func1, content)

# 2. Replace the rendering logic
new_render = r"""      {entry && (
        <>
          <EntryHeroSection entry={entry} colors={colors} showStatus />

          {(() => {
            let youtubeUrl = "";
            for (const group of groupedFields) {
              for (const field of group.fields) {
                if (field.label?.toLowerCase().includes("youtube") || field.label?.toLowerCase().includes("video link")) {
                  if (field.value && typeof field.value === 'string' && field.value.includes('http')) {
                    youtubeUrl = field.value;
                  }
                }
              }
            }

            let videoId = null;
            if (youtubeUrl) {
              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
              const match = youtubeUrl.match(regExp);
              videoId = (match && match[2].length === 11) ? match[2] : null;
            }

            const otherGroups = groupedFields.filter((g: any) => g.title !== "Information" && !g.title?.toLowerCase().includes("member"));
            const memberGroups = groupedFields.filter((g: any) => g.title?.toLowerCase().includes("member"));
            const participantEmail = Object.values(entry?.participant?.submission?.data || {}).find(v => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) as string | undefined;

            return (
              <>
                <InnovationVideoPlayer videoId={videoId} colors={colors} />
                <TeamMembersSection memberGroups={memberGroups} colors={colors} participantEmail={participantEmail} renderFieldValue={renderFieldValue} />
                <EntryDetailsSection otherGroups={otherGroups} colors={colors} videoId={videoId} memberGroupsLength={memberGroups.length} getFieldIcon={getFieldIcon} renderFieldValue={renderFieldValue} />
              </>
            );
          })()}
        </>
      )}
    </Box>
  );
};

export default EntryDetails;"""

def repl_func2(match):
    return new_render

pattern2 = re.compile(r'      \{\/\* Main Entry Hero Card \*\/}.*?export default EntryDetails;\n', re.DOTALL)
if pattern2.search(content):
    content = pattern2.sub(repl_func2, content)
else:
    pattern3 = re.compile(r'      \{\/\* Main Entry Hero Card \*\/}.*?export default EntryDetails;', re.DOTALL)
    content = pattern3.sub(repl_func2, content)

with open("components/layouts/EntryDetails.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated EntryDetails.tsx")
