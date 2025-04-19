# **App Name**: GoalTrackr

## Core Features:

- Match Data Input: Enable users to input match data, including the date, opponent team (selected from a predefined list), tournament (if applicable), and final score.
- Team Roster Management: Allow users to create and manage a list of team players for easy selection when logging match events.
- Media Upload: Enable users to upload photos and videos associated with specific matches or tournaments for record-keeping and sharing.
- Season Performance Dashboard: Visually represent season performance with wins, losses, draws, and a graphical display of the last five results.
- Add match or tournament notes: Allow users to add general notes about the match, or notes about each tournament.

## Style Guidelines:

- Primary color: Use a vibrant green (#32CD32) to represent the soccer field.
- Secondary color: Use a clean white (#FFFFFF) for backgrounds and text.
- Accent: Use a bright blue (#007BFF) for interactive elements and highlights.
- Mobile-first responsive design to ensure usability on various screen sizes.
- Use clear and recognizable soccer-related icons.
- Subtle animations and transitions to enhance user experience.

## Original User Request:
It should be a soccer tracing app, for child soccer matches.

To be clear, this is for soccer matches for small children, and is mainly for the parents of one team. We don't need to know the names of players in other teams. We can however have a table with players of our team.
This is application should be mainly to track the scores of matches of our team.
We should know:
It there was some tournament. Tournament can last one to many days, and our team can play mutiple matches.
The tournament can be mainly in two forms:
each team plays against each team
there are some groups - 2 to n - and after qualifying from group, the team can advance later, to som sort of playoffs, ending in finals. Also sometimes, the teams that did not advance play the last matches, for some standings - for example match for 9th place, match for 5th place, etc.
Then, there can be also normal matches, for example some friendlies, which are on some specified day, but without a tournament.
The application should be able to track the scores of matches with our team. It does not need to track the matches when our team is not playing.
The user will be able to enter matches after they are finished.
It is optional to add the Match Events - for example who scored a goal. It is not necessary. If adding a scored goal, sometimes, it could be also that the other teams scores own goal.
If there is some tournament, it would be good to be able to enter the final standing. For example: 1st.
We should be also able to add some notes about each match, and each tournament.
We should be also able to upload photos or videos for some match or tournament.

There should be also the table with teams, these could be selected (or drag and drop) when entering the data about the match.

This should be a web application, but responsive, mainly used for mobiles. 
The user should be able to:
See the seasons which the matches were played
For each season, we should see the number of wins, losses, draws, and last five results (win, losses, draw, graphically).
After clicking on season, we should be able to list the tournaments, and matches. If it is tournament, it should probably be an accordeon.
We should be also be able to see some photos, or videos, notes and if available - for tournament or match, and goals for match.

It should be done probaly in react, with nice, simple and responsive visuals.
  