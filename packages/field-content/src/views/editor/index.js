/** @jsx jsx */
import { jsx } from '@emotion/core';
import { useMemo } from 'react';
import { Editor } from 'slate-react';
import { Block } from 'slate';
import { plugins as markPlugins } from './marks';
import { type as defaultType } from './blocks/paragraph';
import AddBlock from './AddBlock';
import { useStateWithEqualityCheck } from './hooks';
import Toolbar from './toolbar';

function getSchema(blocks) {
  const schema = {
    document: {
      last: { type: defaultType },
      normalize: (editor, { code, node }) => {
        switch (code) {
          case 'last_child_type_invalid': {
            const paragraph = Block.create(defaultType);
            return editor.insertNodeByKey(node.key, node.nodes.size, paragraph);
          }
        }
      },
    },
    blocks: {},
  };
  Object.keys(blocks).forEach(type => {
    if (typeof blocks[type].getSchema === 'function') {
      schema.blocks[type] = blocks[type].getSchema({ blocks });
    }
  });
  return schema;
}

function Stories({ value: editorState, onChange, blocks, className }) {
  let schema = useMemo(() => {
    return getSchema(blocks);
  }, [blocks]);

  let plugins = useMemo(
    () =>
      Object.values(blocks).reduce(
        (combinedPlugins, block) => {
          if (typeof block.getPlugins !== 'function') {
            return combinedPlugins;
          }
          return [...combinedPlugins, block.getPlugins({ blocks })];
        },
        [
          ...markPlugins,
          {
            renderNode(props) {
              let block = blocks[props.node.type];
              if (block) {
                return <block.Node {...props} blocks={blocks} />;
              }
              return null;
            },
          },
        ]
      ),
    [blocks]
  );

  let [editor, setEditor] = useStateWithEqualityCheck(null);
  return (
    <div className={className}>
      <Editor
        schema={schema}
        ref={setEditor}
        plugins={plugins}
        value={editorState}
        onChange={({ value }) => {
          onChange(value);
        }}
      />
      <AddBlock editor={editor} editorState={editorState} blocks={blocks} />
      <Toolbar {...{ editorState, editor, blocks }} />
    </div>
  );
}

export default Stories;