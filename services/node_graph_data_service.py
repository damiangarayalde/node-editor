from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class NodeGraphDataServiceError(Exception):
    """Custom exception for graph–data service errors"""
    pass


class NodeGraphDataService:
    """Service for providing and persisting the node-graph data used by the frontend."""

    @staticmethod
    def get_default_node_graph() -> Dict[str, List[Dict[str, Any]]]:
        """Return the default graph (nodes + connections) that the client loads on first visit."""
        return {
            'nodes': [
                {
                    'id': 1,
                    'x': 200,
                    'y': 100,
                    'width': 375,
                    'height': 100,
                    'type': 'dni',
                    'title': 'Empty',
                    'state': 'empty',
                    'inputs': [{'id': 'in_1', 'name': 'Input'}],
                    'outputs': [{'id': 'out_1', 'name': 'Output'}],
                    'data': {
                        'name': '',
                        'surname': '',
                        'dateOfBirth': '',
                        'dni': '',
                        'address': ''
                    }
                },
                {
                    'id': 2,
                    'x': 800,
                    'y': 100,
                    'width': 375,
                    'height': 100,
                    'type': 'DocBuilder',
                    'title': 'DocBuilder empty',
                    'inputs': [
                        {'id': 'in_2_vendedor', 'name': 'Vendedor'},
                        {'id': 'in_2_comprador', 'name': 'Comprador'}
                    ],
                    'outputs': [{'id': 'out_2', 'name': 'Output'}]
                }
            ],
            'connections': []
        }

    @staticmethod
    def save_node_graph(graph_data: Dict[str, Any]) -> None:
        """Pretend-persist the supplied graph (nodes + connections).

        In a real application this would talk to a database; for now we just log."""
        try:
            logger.info(
                "Saving %s nodes and %s connections",
                len(graph_data.get('nodes', [])),
                len(graph_data.get('connections', []))
            )
        except Exception as exc:
            logger.error("Error saving graph: %s", exc)
            raise GraphDataServiceError(f"Failed to save graph: {exc}")
