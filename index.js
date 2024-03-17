import { SystemMessage, packageFns } from 'talkpile/gpt/utils';

import goodbye from './fns/goodbye.js';
import get_context from './fns/get_context.js';
import set_context from './fns/set_context.js';

export async function load(session, kitConfig) {

    const command = kitConfig.command;

    const fns = {
        goodbye,
        get_context,
        set_context
    };

    const getPrelude = () => {

        const team = Object.entries(session.delegates)
            .filter(([ _command ]) => _command != command)
            .map(([ name, { description } ]) => ({ name, description }));

        const teamText = `
You have a team of specialized AI agents ready and willing to assist you. You can delegate control to them, allowing them to contribute to the user's workflow and provide specialized support in various domains. The agent will cede control back to you once the task is complete.

**Your Team:**
${team.map(({ name, description }) => `- **${name}**: ${description}`).join('\n')}
`;

        return [
            SystemMessage(`

As an advanced AI agent embedded in a command-line interface (CLI) tool, you serve as a dynamic copilot assisting users in a wide range tasks. You are the user's agent, always acting within the bounds of user consent and operational safety.
${team.length > 0 ? teamText : ''}
**Functions Overview:**

${Object.values(fns).map(fn => `- **${fn.name}**: ${fn.description}`).join('\n')}
- **delegate**: Delegate tasks to members of your team.

**Operational Guidelines:**

1. **User Consent and Confirmation:**
   - Always request explicit user consent before executing actions that modify the file system or retrieve sensitive information.
   - Clearly present the details of the action to be taken, including file paths, URLs, or command details, to ensure informed user decisions.

2. **Safety and Integrity:**
   - Utilize your understanding of the file system and web operations to prevent inadvertent data loss or overwriting. This includes checking for existing files or directories and warning the user of potential impacts.
   - Ensure that operations such as \`write_file\` and \`mkdir\` are conducted with careful consideration of existing structures to avoid unintentional modifications.

3. **Efficiency and Utility:**
   - Leverage your capabilities to enhance user productivity, offering concise and relevant information, and facilitating smooth navigation and management of files and directories.
   - When interacting with the web or executing commands, provide the user with clear, actionable feedback on the outcomes and any errors encountered.

**Engagement and Responsiveness:**
- Maintain an interactive dialogue with the user, providing prompts for input where necessary and offering guidance on potential next steps based on the tool's capabilities.
- Be prepared to execute the \`goodbye\` function promptly when the user indicates the desire to end the session, ensuring a respectful and user-friendly closure.

By adhering to these guidelines, you will support the user effectively across a diverse range of tasks while safeguarding data integrity and privacy. Your role is to empower the user, providing a seamless, efficient, and secure experience.

Current system time is ${new Date().toLocaleString()}.

The following is in the current session context:

\`\`\`json
${get_context(session.context)};
\`\`\`

            `.trim())
        ];
    };

    const messages = [];

    const getTools = () => {
        const tools = packageFns(fns);
        if (Object.keys(session.delegates).length > 1) {
            tools.push({
                type: 'function',
                function: {
                    name: 'delegate',
                    description: 'Delegate tasks to members of your team.',
                    parameters: {
                        type: 'object',
                        properties: {
                            task: {
                                type: 'string',
                                description: 'The task to delegate.'
                            },
                            assignee: {
                                type: 'string',
                                description: 'The person to whom the task is being delegated.'
                            }
                        },
                        required: ['task', 'assignee']
                    }
                }
            });
        }
        return tools;
    }

    const model = kitConfig.model ?? 'gpt-4-0125-preview';
    const temperature = kitConfig.temperature ?? 0.3;
    const frequency_penalty = kitConfig.frequency_penalty ?? 0.2;
    const presence_penalty = kitConfig.presence_penalty ?? 0.2;

    const description = `AI agent for a command-line interface (CLI) tool`;

    return {
        description,
        command,
        getPrelude,
        messages,
        fns,
        getTools,
        model,
        temperature,
        frequency_penalty,
        presence_penalty
    };
}

